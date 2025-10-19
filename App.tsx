import React, { useMemo, useState } from 'react'

function cleanHandleToken(token: string): string | null {
  const cleaned = (token || '').toLowerCase().replace(/[^a-z0-9._]/g, '')
  if (cleaned.length >= 3 && cleaned.length <= 30) return cleaned
  return null
}

function extractHandles(raw: string): Set<string> {
  const out = new Set<string>()
  raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
    const whole = cleanHandleToken(line)
    if (whole) { out.add(whole); return }
    const first = (line.split(/[^a-zA-Z0-9._]+/)[0] || '')
    const cleaned = cleanHandleToken(first)
    if (cleaned) out.add(cleaned)
  })
  return out
}

function toSorted(arr: Set<string> | string[]): string[] {
  const a = Array.isArray(arr) ? arr.slice() : Array.from(arr)
  return a.sort((x, y) => x.localeCompare(y))
}

function downloadCSV(rows: string[][], filename = 'ig_compare_results.csv') {
  const csv = rows.map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [followingText, setFollowingText] = useState('')
  const [followersText, setFollowersText] = useState('')
  const [filterPeopleOnly, setFilterPeopleOnly] = useState(false)

  const { following, followers, nonFollowers, followersOnly, mutuals } = useMemo(() => {
    const following = extractHandles(followingText)
    const followers = extractHandles(followersText)

    const nonFollowers = new Set<string>()
    following.forEach(h => { if (!followers.has(h)) nonFollowers.add(h) })

    const followersOnly = new Set<string>()
    followers.forEach(h => { if (!following.has(h)) followersOnly.add(h) })

    const mutuals = new Set<string>()
    following.forEach(h => { if (followers.has(h)) mutuals.add(h) })

    return { following, followers, nonFollowers, followersOnly, mutuals }
  }, [followingText, followersText])

  const looksLikeOrg = (h: string) => {
    const orgHints = [
      'official','inc','club','school','university','college','gov','news','store','shop','brand','team',
      'miami','umiami','herbert','alumni','football','soccer','hockey','baseball','barstool','daily',
      'studio','photography','kitchen','scuba','kite','freediving','buildon','bestparties','cornerdeli','ifc',
    ]
    return orgHints.some(k => h.includes(k))
  }
  const filterList = (list: string[]) => filterPeopleOnly ? list.filter(h => !looksLikeOrg(h)) : list

  const followingArr = toSorted(following)
  const followersArr = toSorted(followers)
  const nonFollowersArr = filterList(toSorted(nonFollowers))
  const followersOnlyArr = filterList(toSorted(followersOnly))
  const mutualsArr = filterList(toSorted(mutuals))

  const exportCSV = () => {
    const maxLen = Math.max(nonFollowersArr.length, followersOnlyArr.length, mutualsArr.length)
    const rows = [[
      'you_follow_but_they_dont_follow_you',
      'they_follow_you_but_you_dont_follow',
      'mutuals',
    ]]
    for (let i = 0; i < maxLen; i++) {
      rows.push([
        nonFollowersArr[i] ?? '',
        followersOnlyArr[i] ?? '',
        mutualsArr[i] ?? '',
      ])
    }
    downloadCSV(rows)
  }

  return (
    <div className="container">
      <h1 className="title">Instagram Follow‑Back Checker</h1>
      <p className="sub">Paste your lists below. Everything runs locally in your browser — no login, no server.</p>

      <div className="grid">
        <div className="card">
          <div className="head">
            <h2>Following</h2>
            <span className="muted">{followingArr.length} handles</span>
          </div>
          <textarea
            placeholder="Paste your Following list here (messy text is fine — I’ll clean it)"
            value={followingText}
            onChange={e => setFollowingText(e.target.value)}
          />
          <div className="muted" style={{marginTop:8}}>Tip: If IG truncates your list, use “Download Your Information” for a full export.</div>
        </div>

        <div className="card">
          <div className="head">
            <h2>Followers</h2>
            <span className="muted">{followersArr.length} handles</span>
          </div>
          <textarea
            placeholder="Paste your Followers list here (messy text is fine — I’ll clean it)"
            value={followersText}
            onChange={e => setFollowersText(e.target.value)}
          />
          <div className="muted" style={{marginTop:8}}>Nothing leaves your browser. No data is uploaded.</div>
        </div>
      </div>

      <div className="row">
        <button className="btn" onClick={exportCSV}>Export CSV</button>
        <label className="switch">
          <input type="checkbox" checked={filterPeopleOnly} onChange={e => setFilterPeopleOnly(e.target.checked)} />
          <span>Hide brands / orgs</span>
        </label>
        <button className="btn secondary" onClick={() => { setFollowingText(''); setFollowersText(''); }}>Clear</button>
      </div>

      <div className="counts">
        <span className="pill"><b>Following:</b> {followingArr.length}</span>
        <span className="pill"><b>Followers:</b> {followersArr.length}</span>
        <span className="pill"><b>Non‑followers:</b> {nonFollowersArr.length}</span>
        <span className="pill"><b>Followers‑only:</b> {followersOnlyArr.length}</span>
        <span className="pill"><b>Mutuals:</b> {mutualsArr.length}</span>
      </div>

      <div className="cols">
        <Column title="They don’t follow you back" items={nonFollowersArr} />
        <Column title="You don’t follow them back" items={followersOnlyArr} />
        <Column title="Mutuals" items={mutualsArr} />
      </div>

      <p className="footer">Not affiliated with or endorsed by Instagram. © You, {new Date().getFullYear()}</p>
    </div>
  )
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card">
      <div className="head">
        <h3>{title}</h3>
        <span className="muted">{items.length}</span>
      </div>
      <div className="list">
        {items.length === 0 ? (
          <div style={{padding:12}} className="muted">No items.</div>
        ) : (
          <ul>
            {items.map(h => (<li key={h}>@{h}</li>))}
          </ul>
        )}
      </div>
    </div>
  )
}
