import { Location, OpenmrsResource } from '@openmrs/esm-api';

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  });
  return response.json();
}

interface OpenmrsCohort {
  attributes: Array<any>;
  description: string;
  endDate: string;
  groupCohort: boolean;
  links: Array<any>;
  location: Location;
  name: string;
  resourceVersion: string;
  startDate: string;
  uuid: string;
  voidReason: string;
  voided: boolean;
}

interface OpenmrsCohortMember {
  attributes: Array<any>;
  description: string;
  endDate: string;
  name: string;
  uuid: string;
  patient: {
    uuid: string;
  };
}

async function getAllPatientLists() {
  const {
    results,
    error,
  }: {
    results: Array<OpenmrsCohort>;
    error: Error;
  } = await (await fetch('/openmrs/ws/rest/v1/cohortm/cohort?v=default')).json();

  if (error) throw error;

  return results;
}

async function getPatientListMembers(cohortUuid: string) {
  const {
    results,
    error,
  }: {
    results: Array<OpenmrsCohortMember>;
    error: Error;
  } = await (await fetch(`/openmrs/ws/rest/v1/cohortm/cohortmember?cohort=${cohortUuid}&v=default`)).json();

  if (error) throw error;

  const patients: Array<OpenmrsResource> = (
    await fetch('/openmrs/ws/fhir2/R4/Patient/_search?_id=' + results.map((p) => p.patient.uuid).join(','), {
      method: 'POST',
    }).then((res) => res.json())
  ).entry.map((e) => e.resource);

  return patients;
}

async function addPatientToList(patient: { name: string; patient: string; cohort: string }) {
  return postData('/openmrs/ws/rest/v1/cohortm/cohortmember', patient);
}

async function createPatientList(cohort: { name: string }) {
  return postData('/openmrs/ws/rest/v1/cohortm/cohort', {
    ...cohort,
    cohortType: '6df786bf-f15a-49c2-8d2b-1832d961c270',
    location: 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e',
    startDate: '2020-01-01',
    groupCohort: true,
  });
}

globalThis.api = {
  createPatientList,
  addPatientToList,
  getPatientListMembers,
  getAllPatientLists,
};

export default globalThis.api;
