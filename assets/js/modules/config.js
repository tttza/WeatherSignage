const CONFIG = {
  lat: 35.6762,
  lon: 139.6503,
  timezone: "Asia/Tokyo",
  weatherRefresh: 10 * 60 * 1000,
  radarRefresh: 10 * 60 * 1000,
  chartHours: 24,
  chartPadding: 6,
  historyHours: 24,
  historyStepHours: 1,
  historyShiftHours: 24,
};

export const getConfig = () => CONFIG;
