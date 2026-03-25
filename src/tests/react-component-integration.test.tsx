/**
 * @jest-environment ./jest-environment-jsdom-with-fetch.js
 *
 * Integration tests for React linked components backed by a real Fuseki store.
 *
 * Uses the same Fuseki Docker setup and test fixtures as @_linked/core.
 * Auto-starts Fuseki via Docker if not already running.
 * Needs real fetch (not jsdom's stub) so we use a custom environment.
 */
import {describe, expect, test, beforeAll, afterAll, afterEach} from '@jest/globals';
import React from 'react';
import {render, waitFor, cleanup} from '@testing-library/react';
import {linkedComponent, linkedSetComponent} from '../package.js';
import {Shape} from '@_linked/core/shapes/Shape';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {setDefaultPageLimit} from '@_linked/core/utils/Package';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage';
import {
  Person,
  Dog,
  tmpEntityBase,
} from '@_linked/core/test-helpers/query-fixtures';
import {
  ensureFuseki,
  stopFuseki,
  createTestDataset,
  deleteTestDataset,
  loadTestData,
  clearAllData,
} from '@_linked/core/test-helpers/fuseki-test-store';
import {FusekiStore} from '@_linked/core/test-helpers/FusekiStore';
import {setQueryContext} from '@_linked/core/queries/QueryContext';

// ---------------------------------------------------------------------------
// SHACL-generated shape URIs (must match what the SPARQL pipeline uses)
// ---------------------------------------------------------------------------

const P = 'https://data.lincd.org/module/-_linked-core/shape/person';
const D = 'https://data.lincd.org/module/-_linked-core/shape/dog';
const PET = 'https://data.lincd.org/module/-_linked-core/shape/pet';
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const ENT = tmpEntityBase;

const p1Uri = `${ENT}p1`;
const p2Uri = `${ENT}p2`;
const p3Uri = `${ENT}p3`;
const p4Uri = `${ENT}p4`;

// ---------------------------------------------------------------------------
// N-Triples test data (same as @_linked/core integration tests)
// ---------------------------------------------------------------------------

const TEST_DATA = `
<${ENT}p1> <${RDF_TYPE}> <${P}> .
<${ENT}p1> <${P}/name> "Semmy" .
<${ENT}p1> <${P}/hobby> "Reading" .
<${ENT}p1> <${P}/bestFriend> <${ENT}p3> .
<${ENT}p1> <${P}/friends> <${ENT}p2> .
<${ENT}p1> <${P}/friends> <${ENT}p3> .
<${ENT}p1> <${P}/pets> <${ENT}dog1> .
<${ENT}p2> <${RDF_TYPE}> <${P}> .
<${ENT}p2> <${P}/name> "Moa" .
<${ENT}p2> <${P}/hobby> "Jogging" .
<${ENT}p2> <${P}/bestFriend> <${ENT}p3> .
<${ENT}p2> <${P}/friends> <${ENT}p3> .
<${ENT}p2> <${P}/friends> <${ENT}p4> .
<${ENT}p2> <${P}/pets> <${ENT}dog2> .
<${ENT}p3> <${RDF_TYPE}> <${P}> .
<${ENT}p3> <${P}/name> "Jinx" .
<${ENT}p4> <${RDF_TYPE}> <${P}> .
<${ENT}p4> <${P}/name> "Quinn" .
<${ENT}dog1> <${RDF_TYPE}> <${D}> .
<${ENT}dog1> <${RDF_TYPE}> <${PET}> .
<${ENT}dog1> <${D}/guardDogLevel> "2"^^<${XSD}integer> .
<${ENT}dog2> <${RDF_TYPE}> <${D}> .
<${ENT}dog2> <${RDF_TYPE}> <${PET}> .
`.trim();

// ---------------------------------------------------------------------------
// Fuseki lifecycle
// ---------------------------------------------------------------------------

let fusekiAvailable = false;

beforeAll(async () => {
  fusekiAvailable = await ensureFuseki();
  if (!fusekiAvailable) {
    console.log('Fuseki not available — skipping react integration tests');
    return;
  }

  // Set up store
  const store = new FusekiStore('http://localhost:3030', 'nashville-test');
  LinkedStorage.setDefaultStore(store);

  // Set up query context
  setQueryContext('user', {id: p3Uri}, Person);

  // Create dataset + load data
  await createTestDataset();
  await clearAllData();
  await loadTestData(TEST_DATA);
}, 60000);

afterEach(() => {
  cleanup();
  setDefaultPageLimit(12);
});

afterAll(async () => {
  if (!fusekiAvailable) return;
  await deleteTestDataset();
  await stopFuseki();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('React component integration (Fuseki)', () => {
  test('component with single property query', async () => {
    if (!fusekiAvailable) return;

    const Component = linkedComponent(
      Person.select((p) => p.name),
      ({name}) => <div>{name}</div>,
    );

    const component = render(<Component of={{id: p1Uri}} />);

    await waitFor(() => expect(component.getByText('Semmy')).toBeTruthy(), {
      timeout: 5000,
      interval: 50,
    });
  });

  test('component with where query', async () => {
    if (!fusekiAvailable) return;

    const query = Person.select(
      (p) => p.friends.where((f) => f.name.equals('Jinx')).name,
    );

    const Component2 = linkedComponent(query, ({friends}) => {
      return <div>{friends[0].name}</div>;
    });

    const component = render(<Component2 of={{id: p1Uri}} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
  });

  test('component with custom props', async () => {
    if (!fusekiAvailable) return;

    const query = Person.select(
      (p) => p.friends.where((f) => f.name.equals('Jinx')).name,
    );

    const ComponentWithCustomProps = linkedComponent<typeof query, {custom1: boolean}>(
      query,
      ({friends, custom1}) => (
        <div>
          <span>{friends[0].name}</span>
          <span>{custom1.toString()}</span>
        </div>
      ),
    );

    const component = render(
      <ComponentWithCustomProps of={{id: p1Uri}} custom1={true} />,
    );
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
    await waitFor(() => expect(component.getByText('true')).toBeTruthy());
  });

  test('component requesting data from child components', async () => {
    if (!fusekiAvailable) return;

    const childQuery = Person.select((p) => p.name);
    const ChildComponent = linkedComponent(childQuery, ({name}) => (
      <span>{name}</span>
    ));

    const parentQuery = Person.select((p) => [
      p.hobby,
      p.bestFriend.preloadFor(ChildComponent),
    ]);

    const ParentComponent = linkedComponent(parentQuery, ({hobby, bestFriend}) => (
      <>
        <span>{hobby.toString()}</span>
        <ChildComponent of={bestFriend} />
      </>
    ));

    const component = render(<ParentComponent of={{id: p2Uri}} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
    await waitFor(() => expect(component.getByText('Jogging')).toBeTruthy());
  });

  test('linked set components', async () => {
    if (!fusekiAvailable) return;

    const NameList = linkedSetComponent(
      Person.select((person) => [person.name, person.hobby]),
      ({linkedData}) => (
        <ul>
          {linkedData.map((person) => (
            <li key={person.id}>
              <span>{person.name}</span>
              <span>{person.hobby}</span>
            </li>
          ))}
        </ul>
      ),
    );

    const persons = new ShapeSet([
      new Person({id: p1Uri}),
      new Person({id: p2Uri}),
      new Person({id: p3Uri}),
      new Person({id: p4Uri}),
    ]);

    const component = render(<NameList of={persons} />);
    await waitFor(() => {
      expect(component.getByText('Semmy')).toBeTruthy();
      expect(component.getByText('Moa')).toBeTruthy();
      expect(component.getByText('Jinx')).toBeTruthy();
      expect(component.getByText('Quinn')).toBeTruthy();
    });
  });

  test('linked set components without source', async () => {
    if (!fusekiAvailable) return;

    const NameList = linkedSetComponent(
      Person.select((person) => [person.name, person.hobby]),
      ({linkedData}) => (
        <ul>
          {linkedData.map((person) => (
            <li key={person.id}>
              <span>{person.name}</span>
              <span>{person.hobby}</span>
            </li>
          ))}
        </ul>
      ),
    );

    const component = render(<NameList />);
    await waitFor(() => {
      expect(component.getByText('Semmy')).toBeTruthy();
      expect(component.getByText('Moa')).toBeTruthy();
      expect(component.getByText('Jinx')).toBeTruthy();
      expect(component.getByText('Quinn')).toBeTruthy();
    });
  });

  test('linked set component with default page limit', async () => {
    if (!fusekiAvailable) return;

    setDefaultPageLimit(2);

    const NameList = linkedSetComponent(
      Person.select((person) => [person.name, person.hobby]),
      ({linkedData}) => (
        <ul>
          {linkedData.map((person) => (
            <li key={person.id}>
              <span role="name">{person.name}</span>
            </li>
          ))}
        </ul>
      ),
    );

    const component = render(<NameList />);
    await waitFor(() => {
      expect(component.getAllByRole('name').length).toBe(2);
    });
  });
});
