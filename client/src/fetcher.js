import config from "./config.json";

const getAllStates = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/states`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getCaseAndStock = async (code, state, start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/case/stock?code=${code}&state=${state}&start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateVolatility = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state/volatility?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateCaseNorm = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state/case/norm?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};
export { getCaseAndStock, getAllStates, getStateVolatility, getStateCaseNorm };
