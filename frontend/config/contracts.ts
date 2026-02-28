import Governor from "../abi/Governor.json";
// Eğer frontend doğrudan market/treasury ile konuşacaksa onların ABI’lerini de ekleyeceksin.
// import PredictionMarket from "../abi/PredictionMarket.json";
// import Treasury from "../abi/Treasury.json";

export const ADDRESSES = {
  governor: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
  predictionMarket: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  treasury: "0x9A676e781A523b5d0C0e43731313A708CB607508",
} as const;

export const GOVERNOR_ADDRESS = ADDRESSES.governor;
export const GOVERNOR_ABI = (Governor as any).abi as any[];

// Opsiyonel (gerekirse aç)
// export const PREDICTION_MARKET_ADDRESS = ADDRESSES.predictionMarket;
// export const PREDICTION_MARKET_ABI = (PredictionMarket as any).abi as any[];

// export const TREASURY_ADDRESS = ADDRESSES.treasury;
// export const TREASURY_ABI = (Treasury as any).abi as any[];