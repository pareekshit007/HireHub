// Email disabled — all functions are no-ops
const noop = async () => {};

module.exports = {
  sendOTPEmail:                noop,
  sendApplicationConfirmation: noop,
  sendNewApplicationAlert:     noop,
  sendStatusUpdateEmail:       noop,
  sendJobStatusEmail:          noop,
};