// Shim so existing "serverSideTranslations" imports don't break during build/SSG.
export async function serverSideTranslations(/* locale, namespaces */) {
  return {};
}
