import config from "./config.json";

const getCaseAndStock = async (code, state, start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/case_and_stock?code=${code}&state=${state}&start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getAllStates = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/get_states`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateStock = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state_stock?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateCases = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state_confirmed_case?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};
export { getCaseAndStock, getAllStates, getStateStock, getStateCases };
