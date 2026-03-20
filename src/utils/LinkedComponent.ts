import {
  GetCustomObjectKeys,
  QResult,
  QueryController,
  QueryControllerProps,
  QueryResponseToResultType,
  ToQueryResultSet,
} from '@_linked/core/queries/SelectQuery';
import {Shape} from '@_linked/core/shapes/Shape';
import {QueryBuilder} from '@_linked/core/queries/QueryBuilder';
import {FieldSet} from '@_linked/core/queries/FieldSet';
import {getQueryDispatch} from '@_linked/core/queries/queryDispatch';

import React, {useCallback, useEffect, useState} from 'react';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage';
import {DEFAULT_LIMIT} from '@_linked/core/utils/Package';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {isNodeReferenceValue, NodeReferenceValue} from '@_linked/core/utils/NodeReference';
import {getShapeClass, hasSuperClass} from '@_linked/core/utils/ShapeClass';

/**
 * Extract the Shape type parameter from a QueryBuilder.
 */
type GetQueryShapeType<Q> = Q extends QueryBuilder<infer S, any, any> ? S : never;

/**
 * Extract the query response type from a QueryBuilder or FieldSet.
 * Falls through to Q itself if neither matches (preserves legacy behaviour).
 */
type GetQueryResponseType<Q> =
  Q extends QueryBuilder<any, infer R, any> ? R :
  Q extends FieldSet<infer R, any> ? R :
  Q;

/**
 * A wrapper object mapping a single key to a QueryBuilder (used by linkedSetComponent).
 */
type QueryWrapperObject<ShapeType extends Shape = any> = {
  [key: string]: QueryBuilder<ShapeType>;
};

type ProcessDataResultType<ShapeType extends Shape> = [
  typeof Shape,
  QueryBuilder<ShapeType>,
];

export type Component<P = any, ShapeType extends Shape = Shape> =
  | ClassComponent<P, ShapeType>
  | LinkedComponent<P, ShapeType>
  | LinkedSetComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
  extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
  props: P & LinkedComponentProps<ShapeType>;
  shape?: typeof Shape;
}

export interface LinkedComponent<
  P,
  ShapeType extends Shape = Shape,
  ResultType = any,
> extends React.FC<
    P & LinkedComponentInputProps<ShapeType> & React.ComponentPropsWithRef<any>
  > {
  original?: LinkableComponent<P, ShapeType>;
  query: QueryBuilder<any>;
  shape?: typeof Shape;
}

export interface LinkedSetComponent<
  P,
  ShapeType extends Shape = Shape,
  Res = any,
> extends React.FC<
    P &
      LinkedSetComponentInputProps<ShapeType> &
      React.ComponentPropsWithRef<any>
  > {
  original?: LinkableSetComponent<P, ShapeType>;
  query: QueryBuilder<any> | QueryWrapperObject<ShapeType>;
  shape?: typeof Shape;
}

export type LinkableComponent<P, ShapeType extends Shape = Shape> = React.FC<
  P & LinkedComponentProps<ShapeType>
>;
export type LinkableSetComponent<
  P,
  ShapeType extends Shape = Shape,
  DataResultType = any,
> = React.FC<LinkedSetComponentProps<ShapeType, DataResultType> & P>;

export interface LinkedSetComponentProps<
  ShapeType extends Shape,
  DataResultType = any,
> extends LinkedComponentBaseProps<DataResultType>,
    QueryControllerProps {
  sources: ShapeSet<ShapeType>;
}

export interface LinkedComponentProps<ShapeType extends Shape>
  extends LinkedComponentBaseProps {
  source: ShapeType;
  _refresh: (updatedProps?: any) => void;
}

interface LinkedComponentBaseProps<DataResultType = any>
  extends React.PropsWithChildren {
  linkedData?: DataResultType;
}

export interface LinkedSetComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  of?: ShapeSet<ShapeType> | QResult<ShapeType>[];
}

export interface LinkedComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  of: NodeReferenceValue | ShapeType | QResult<ShapeType>;
}

interface LinkedComponentInputBaseProps extends React.PropsWithChildren {
  className?: string | string[];
  style?: React.CSSProperties;
}

export type LinkedSetComponentFactoryFn = <
  QueryType extends
    | QueryBuilder<any>
    | {[key: string]: QueryBuilder<any>} = null,
  CustomProps = {},
  ShapeType extends Shape = GetQueryShapeType<QueryType>,
  Res = ToQueryResultSet<QueryType>,
>(
  requiredData: QueryType,
  functionalComponent: LinkableSetComponent<
    CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps,
    ShapeType,
    Res
  >,
) => LinkedSetComponent<CustomProps, ShapeType, Res>;

export type LinkedComponentFactoryFn = <
  QueryType extends QueryBuilder<any> = null,
  CustomProps = {},
  ShapeType extends Shape = GetQueryShapeType<QueryType>,
  Response = GetQueryResponseType<QueryType>,
  ResultType = QueryResponseToResultType<Response, ShapeType>,
>(
  query: QueryType,
  functionalComponent: LinkableComponent<CustomProps & ResultType, ShapeType>,
) => LinkedComponent<CustomProps, ShapeType, ResultType>;

export function createLinkedComponentFn(
  registerPackageExport,
  registerComponent,
) {
  return function linkedComponent<
    QueryType extends QueryBuilder<any> = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = GetQueryResponseType<QueryType>,
  >(
    query: QueryType,
    functionalComponent: LinkableComponent<
      CustomProps &
        QueryResponseToResultType<Res, ShapeType>,
      ShapeType
    >,
  ): LinkedComponent<CustomProps, ShapeType, Res> {
    let [shapeClass, actualQuery] = processQuery<ShapeType>(query);

    let _wrappedComponent: LinkedComponent<CustomProps, ShapeType> =
      React.forwardRef<any, CustomProps & LinkedComponentInputProps<ShapeType>>(
        (props, ref) => {
          let [queryResult, setQueryResult] = useState<any>(undefined);
          let [loadingData, setLoadingData] = useState<string>();

          let linkedProps: any = getLinkedComponentProps<
            ShapeType,
            CustomProps
          >(props as any, shapeClass);
          if (ref) {
            linkedProps.ref = ref;
          }

          const loadData = () => {
            const sourceId = linkedProps.source?.id;
            if (!loadingData || loadingData !== sourceId) {
              // QueryBuilder is immutable — chain calls produce new instances.
              let requestQuery = linkedProps.source
                ? actualQuery.for(linkedProps.source)
                : actualQuery;

              setLoadingData(sourceId || requestQuery.toJSON().subject);
              getQueryDispatch().selectQuery(requestQuery.build()).then((result) => {
                setQueryResult(result);
                setLoadingData(null);
              });
            } else {
              console.warn(
                `Already loading data for source ${loadingData}, ignoring request`,
              );
            }
          };

          let sourceIsValidQResult = isValidQResult(props.of, actualQuery);

          if (queryResult || sourceIsValidQResult) {
            linkedProps = Object.assign(linkedProps, queryResult || props.of);
          }

          linkedProps._refresh = useCallback(
            (updatedProps) => {
              if (updatedProps) {
                if (queryResult) {
                  setQueryResult({...queryResult, ...updatedProps});
                } else if (sourceIsValidQResult) {
                  setQueryResult({...props.of, ...updatedProps});
                }
              } else {
                loadData();
              }
            },
            [queryResult, props.of],
          );

          if (!linkedProps.source && !actualQuery.toJSON().subject) {
            console.warn(
              'This component requires a source to be provided (use the property "of"): ' +
                functionalComponent.name,
            );
            return null;
          }

          let usingStorage = LinkedStorage.isInitialised();

          useEffect(() => {
            if (queryResult) {
              setQueryResult(undefined);
            }

            if (usingStorage && !sourceIsValidQResult) {
              loadData();
            }
          }, [linkedProps.source?.id]);

          let dataIsLoaded =
            queryResult || !usingStorage || sourceIsValidQResult;

          // Keep legacy client-side guard to avoid hydration drift.
          if (dataIsLoaded && typeof window !== 'undefined') {
            return React.createElement(functionalComponent, linkedProps);
          } else {
            return createLoadingSpinner();
          }
        },
      ) as any;

    _wrappedComponent.original = functionalComponent;
    _wrappedComponent.query = query;
    _wrappedComponent.shape = shapeClass;
    if (functionalComponent.name) {
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      registerPackageExport(_wrappedComponent);
    }

    registerComponent(_wrappedComponent, shapeClass);

    return _wrappedComponent;
  };
}

export function createLinkedSetComponentFn(
  registerPackageExport,
  registerComponent,
) {
  return function linkedSetComponent<
    QueryType extends
      | QueryBuilder<any>
      | {[key: string]: QueryBuilder<any>} = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = ToQueryResultSet<QueryType>,
  >(
    query: QueryType,
    functionalComponent: LinkableSetComponent<
      CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps,
      ShapeType
    >,
  ): LinkedSetComponent<CustomProps, ShapeType, Res> {
    let [shapeClass, actualQuery] = processQuery<ShapeType>(query as any, true);

    let usingStorage = LinkedStorage.isInitialised();

    let _wrappedComponent: LinkedSetComponent<CustomProps, ShapeType, Res> =
      React.forwardRef<
        any,
        CustomProps & LinkedSetComponentInputProps<ShapeType>
      >((props, ref) => {
        let [queryResult, setQueryResult] = useState<any>(undefined);

        let linkedProps = getLinkedSetComponentProps<
          ShapeType,
          any
        >(props, shapeClass, functionalComponent);

        let defaultLimit = actualQuery.toJSON().limit || DEFAULT_LIMIT;
        let [limit, setLimit] = useState<number>(defaultLimit);
        let [offset, setOffset] = useState<number>(0);

        if (ref) {
          (linkedProps as any).ref = ref;
        }

        let sourceIsValidQResult =
          Array.isArray(props.of) &&
          props.of.length > 0 &&
          typeof (props.of[0] as QResult<any>)?.id === 'string' &&
          isValidSetQResult(props.of as QResult<any>[], actualQuery);

        if (queryResult || sourceIsValidQResult) {
          let dataResult;
          if (queryResult) {
            dataResult = queryResult;
          } else {
            if (limit) {
              dataResult = (props.of as Array<QResult<any>>).slice(
                offset || 0,
                offset + limit,
              );
            } else {
              dataResult = props.of;
            }
          }
          if (query instanceof QueryBuilder) {
            linkedProps = Object.assign(linkedProps, {
              linkedData: dataResult,
            });
          } else {
            let key = Object.keys(query)[0];
            linkedProps[key] = dataResult;
          }
        }

        if (limit) {
          linkedProps.query = {
            nextPage: () => {
              setOffset(offset + limit);
            },
            previousPage: () => {
              setOffset(Math.max(0, offset - limit));
            },
            setLimit: (newLimit: number) => {
              setLimit(newLimit);
            },
            setPage: (page: number) => {
              setOffset(page * limit);
            },
          } as QueryController;
        }

        useEffect(() => {
          if (usingStorage && !sourceIsValidQResult) {
            // QueryBuilder is immutable — chain calls to set subjects, limit, offset.
            let requestQuery: QueryBuilder<any> = actualQuery;
            if (linkedProps.sources) {
              requestQuery = requestQuery.forAll(
                Array.from(linkedProps.sources).map((s: Shape) => ({id: s.id})),
              );
            }
            if (limit) {
              requestQuery = requestQuery.limit(limit);
            }
            if (offset) {
              requestQuery = requestQuery.offset(offset);
            }

            getQueryDispatch().selectQuery(requestQuery.build()).then((result) => {
              setQueryResult(result);
            });
          }
        }, [props.of, limit, offset]);

        let dataIsLoaded = queryResult || !usingStorage || sourceIsValidQResult;

        if (
          typeof queryResult === 'undefined' &&
          usingStorage &&
          !sourceIsValidQResult
        ) {
          dataIsLoaded = false;
        }

        if (dataIsLoaded) {
          return React.createElement(functionalComponent, linkedProps);
        } else {
          return createLoadingSpinner();
        }
      }) as any;

    _wrappedComponent.original = functionalComponent;
    _wrappedComponent.query = query;

    _wrappedComponent.shape = shapeClass;
    if (functionalComponent.name) {
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      registerPackageExport(_wrappedComponent);
    }

    registerComponent(_wrappedComponent, shapeClass);

    return _wrappedComponent;
  };
}

function getLinkedComponentProps<ShapeType extends Shape, P>(
  props: LinkedComponentInputProps<ShapeType> & P,
  shapeClass,
): Omit<LinkedComponentProps<ShapeType>, '_refresh'> & P {
  let newProps = {
    ...props,
    source: getSourceFromInputProps(props, shapeClass),
  };

  if (newProps.of) {
    for (let key of Object.getOwnPropertyNames(newProps.of)) {
      if (key !== 'shape' && key !== 'id') {
        newProps[key] = (newProps.of as any)[key];
      }
    }
  }

  delete (newProps as any).of;
  return newProps;
}

function processQuery<ShapeType extends Shape>(
  requiredData: QueryBuilder<ShapeType> | QueryWrapperObject<ShapeType>,
  setComponent: boolean = false,
): ProcessDataResultType<ShapeType> {
  let shapeClass: typeof Shape;
  let query: QueryBuilder<ShapeType>;

  if (requiredData instanceof QueryBuilder) {
    query = requiredData;
    // QueryBuilder._shape is private; extract shape IRI via toJSON and resolve the class.
    shapeClass = getShapeClass(requiredData.toJSON().shape) as unknown as typeof Shape;
  } else if (typeof requiredData === 'object' && setComponent) {
    if (Object.keys(requiredData).length > 1) {
      throw new Error(
        'Only one key is allowed to map a query to a property for linkedSetComponents',
      );
    }
    for (let key in requiredData) {
      if (requiredData[key] instanceof QueryBuilder) {
        shapeClass = getShapeClass(requiredData[key].toJSON().shape) as unknown as typeof Shape;
        query = requiredData[key];
      } else {
        throw new Error(
          'Unknown value type for query object. Keep to this format: {propName: Shape.select(s => ...)}',
        );
      }
    }
  } else {
    throw new Error(
      'Unknown data query type. Expected a QueryBuilder (from Shape.select()) or an object with 1 key whose value is a QueryBuilder',
    );
  }
  return [shapeClass, query];
}

function getLinkedSetComponentProps<ShapeType extends Shape, P>(
  props: LinkedSetComponentInputProps<ShapeType>,
  shapeClass,
  functionalComponent,
): LinkedSetComponentProps<ShapeType> & P {
  if (
    props.of &&
    !(props.of instanceof ShapeSet) &&
    !Array.isArray(props.of)
  ) {
    throw Error(
      "Invalid argument 'of' provided to " +
        functionalComponent.name.replace('_implementation', '') +
        ' component: ' +
        props.of +
        '. Make sure to provide a ShapeSet, an array of QResults, or no argument at all to load all instances.',
    );
  }

  let sources: ShapeSet<ShapeType>;
  if (props.of instanceof ShapeSet) {
    sources = props.of;
  } else if (Array.isArray(props.of)) {
    sources = new ShapeSet(
      props.of.map((item) => {
        return getSourceFromInputProps({of: item}, shapeClass);
      }),
    );
  }

  const newProps = {
    ...props,
    sources,
  };

  delete (newProps as any).of;
  return newProps as LinkedSetComponentProps<ShapeType> & P;
}

export function getSourceFromInputProps(props, shapeClass) {
  const input = props?.of;

  if (input instanceof Shape) {
    if (
      input.nodeShape !== shapeClass.shape &&
      !hasSuperClass(getShapeClass(input.nodeShape.id), shapeClass)
    ) {
      return new shapeClass(input.id);
    }
    return input;
  }

  if (isNodeReferenceValue(input)) {
    return new shapeClass(input);
  }

  // If nothing is provided, keep undefined; callers handle required source checks.
  return input;
}

/**
 * Check if a QResult has all the fields the query selects.
 */
function isValidQResult(of: any, query: QueryBuilder<any>): boolean {
  if (typeof (of as QResult<any>)?.id !== 'string') return false;
  const fieldSet = query.fields();
  if (!fieldSet) return false;
  const labels = fieldSet.labels();
  return labels.every((label) => label in of);
}

/**
 * Check if an array of QResults all have the fields the query selects.
 */
function isValidSetQResult(qResults: QResult<any>[], query: QueryBuilder<any>): boolean {
  return qResults.every((qResult) => isValidQResult(qResult, query));
}

function createLoadingSpinner() {
  return React.createElement(
    'div',
    {
      className: 'ld-loader',
      'aria-label': 'Loading',
      role: 'status',
    },
  );
}
