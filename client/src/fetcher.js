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

const getAllStocks = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/stocks`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStocks = async (
  code,
  state,
  start,
  end,
  industry,
  threshold,
  corr
) => {
  console.log(
    `http://${config.server_host}:${config.server_port}/search/stocks?code=${code}&state=${state}&start=${start}&end=${end}&industry=${industry}&threshold=${threshold}&corr=${corr}`
  );
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/search/stocks?code=${code}&state=${state}&start=${start}&end=${end}&industry=${industry}&threshold=${threshold}&corr=${corr}`,
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
export {
  getCaseAndStock,
  getAllStocks,
  getAllStates,
  getStocks,
  getStateVolatility,
  getStateCaseNorm,
};
