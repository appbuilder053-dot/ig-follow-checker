import React, { useMemo, useState } from "react";

/**
 * Instagram Follow‑Back Checker — client‑only
 * Paste your two lists (Following + Followers) and compute:
 *  - You follow ➜ they don’t follow back
 *  - They follow you ➜ you don’t follow back
 *  - Mutuals
 *
 * All processing happens locally in your browser.
 */

function cleanHandleToken(token: string): string | null {
  // Keep only [a-z0-9._], 3–30 chars, lowercase
  const cleaned = (token || "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
  if (cleaned.length >= 3 && cleaned.length <= 30) return cleaned;
  return null;
}

function extractHandles(raw: string): Set<string> {
  // Strategy: split by lines, then for each line, take the first token‑like chunk
  // before any spaces/pipes/emoji. Then clean & validate.
  const out = new Set<string>();
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      // If the whole line looks like a handle already, prefer that.
      const whole = cleanHandleToken(line);
      if (whole) {
        out.add(whole);
        return;
      }
      // Else just take the first token before spacing/symbols like | · –
      const firstToken = line.split(/[^a-zA-Z0-9._]+/)[0] || "";
      const cleaned = cleanHandleToken(firstToken);
      if (cleaned) out.add(cleaned);
    });
  return out;
}

function toSortedArray(s: Set<string> | string[]): string[] {
  const arr = Array.isArray(s) ? s.slice() : Array.from(s);
  return arr.sort((a, b) => a.localeCompare(b));
}

function downloadCSV(rows: string[][], filename = "ig_compare_results.csv") {
  const csv = rows
    .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function IGFollowBackChecker() {
  const [followingText, setFollowingText] = useState("");
  const [followersText, setFollowersText] = useState("");
  const [filterPeopleOnly, setFilterPeopleOnly] = useState(false);

  const { following, followers, nonFollowers, followersOnly, mutuals } = useMemo(() => {
    const following = extractHandles(followingText);
    const followers = extractHandles(followersText);

    // Set operations
    const nonFollowers = new Set<string>(); // you follow ➜ they don’t follow back
    following.forEach((h) => {
      if (!followers.has(h)) nonFollowers.add(h);
    });

    const followersOnly = new Set<string>(); // they follow ➜ you don’t follow back
    followers.forEach((h) => {
      if (!following.has(h)) followersOnly.add(h);
    });

    const mutuals = new Set<string>(); // both follow each other
    following.forEach((h) => {
      if (followers.has(h)) mutuals.add(h);
    });

    return { following, followers, nonFollowers, followersOnly, mutuals };
  }, [followingText, followersText]);

  // Simple heuristic to hide brand/org accounts (optional filter):
  const looksLikeOrg = (h: string) => {
    const orgHints = [
      "official", "inc", "club", "school", "university", "college", "gov",
      "news", "store", "shop", "brand", "team", "miami", "umiami",
      "herbert", "alumni", "football", "soccer", "hockey", "baseball",
      "barstool", "daily", "studio", "photography", "kitchen", "scuba",
      "kite", "freediving", "buildon", "bestparties", "cornerdeli", "ifc",
    ];
    return orgHints.some((k) => h.includes(k));
  };

  const filterList = (arr: string[]) =>
    filterPeopleOnly ? arr.filter((h) => !looksLikeOrg(h)) : arr;

  const followingArr = toSortedArray(following);
  const followersArr = toSortedArray(followers);
  const nonFollowersArr = filterList(toSortedArray(nonFollowers));
  const followersOnlyArr = filterList(toSortedArray(followersOnly));
  const mutualsArr = filterList(toSortedArray(mutuals));

  const exportCSV = () => {
    const maxLen = Math.max(nonFollowersArr.length, followersOnlyArr.length, mutualsArr.length);
    const rows = [[
      "you_follow_but_they_dont_follow_you",
      "they_follow_you_but_you_dont_follow",
      "mutuals",
    ]];
    for (let i = 0; i < maxLen; i++) {
      rows.push([
        nonFollowersArr[i] ?? "",
        followersOnlyArr[i] ?? "",
        mutualsArr[i] ?? "",
      ]);
    }
    downloadCSV(rows);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Instagram Follow‑Back Checker</h1>
        <p className="mt-2 text-neutral-600">Paste your lists below. Everything runs in your browser — no login, no uploads.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Following</h2>
              <span className="text-sm text-neutral-500">{followingArr.length} handles</span>
            </div>
            <textarea
              className="w-full h-56 md:h-64 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Paste your Following list here (one username per line, or raw text copied from Instagram)`}
              value={followingText}
              onChange={(e) => setFollowingText(e.target.value)}
            />
            <div className="mt-2 text-xs text-neutral-500">
              Tip: You can paste the messy text straight from Instagram — I’ll clean it.
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Followers</h2>
              <span className="text-sm text-neutral-500">{followersArr.length} handles</span>
            </div>
            <textarea
              className="w-full h-56 md:h-64 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Paste your Followers list here (one username per line, or raw text copied from Instagram)`}
              value={followersText}
              onChange={(e) => setFollowersText(e.target.value)}
            />
            <div className="mt-2 text-xs text-neutral-500">
              If Instagram truncates the list, use Settings → Your activity → Download your information for full data.
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 active:scale-[.99]"
          >
            Export CSV
          </button>

          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-4"
              checked={filterPeopleOnly}
              onChange={(e) => setFilterPeopleOnly(e.target.checked)}
            />
            Hide brands / orgs
          </label>

          <button
            onClick={() => { setFollowingText(""); setFollowersText(""); }}
            className="px-3 py-2 rounded-xl bg-neutral-200 text-neutral-800 font-medium hover:bg-neutral-300"
          >
            Clear
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title={`They don’t follow you back`}
            count={nonFollowersArr.length}
            items={nonFollowersArr}
          />
          <Card
            title={`You don’t follow them back`}
            count={followersOnlyArr.length}
            items={followersOnlyArr}
          />
          <Card
            title={`Mutuals`}
            count={mutualsArr.length}
            items={mutualsArr}
          />
        </div>
      </div>
    </div>
  );
}

function Card({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-neutral-500">{count}</span>
      </div>
      <div className="mt-3 h-72 overflow-auto border rounded-xl">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">No items.</div>
        ) : (
          <ul className="divide-y">
            {items.map((h) => (
              <li key={h} className="px-3 py-2 text-sm font-mono">@{h}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
