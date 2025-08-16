// lib/i18n-server.js
// No-op shim so pages that import `next-i18next/serverSideTranslations` keep building.
async function serverSideTranslations(/* locale, ns */) {
  return {};
}

module.exports = {
  serverSideTranslations,
  default: serverSideTranslations,
};
