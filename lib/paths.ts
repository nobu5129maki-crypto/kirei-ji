/** 先頭が / のアプリ内パスを、<base> からの相対パスにする。 */
export function toBaseRelative(href: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  if (href.startsWith("#")) return href;

  const hashAt = href.indexOf("#");
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const beforeHash = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const queryAt = beforeHash.indexOf("?");
  const query = queryAt >= 0 ? beforeHash.slice(queryAt) : "";
  const path = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;

  if (!path.startsWith("/")) return href;

  let rel = path.replace(/^\/+/, "");
  if (rel === "") {
    rel = "./";
  } else if (!rel.endsWith("/")) {
    rel += "/";
  }
  return rel + query + hash;
}
