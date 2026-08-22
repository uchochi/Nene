/**
 * Dataset Signature System
 *
 * Gives every exported dataset a unique, at-a-glance recognizable structure.
 * Each dataset generation randomly draws one ID from DATASET_IDS and one
 * fingerprint from DATASET_FINGERPRINTS (50 candidates each). The drawn pair is
 * used consistently across the whole file: JSONL comment header/footer blocks,
 * the JSON `_dataset_meta` metadata wrapper, CSV comment header/footer lines,
 * and the `_dataset_sig` field/column stamped on every entry.
 *
 * See UNIQUE_DATASET_STRUCTURE.md at the project root for the full spec.
 */

export interface DatasetSignature {
  /** Drawn from DATASET_IDS, e.g. "DS-62WG-GF" — also stamped as `_dataset_sig` */
  id: string
  /** Drawn from DATASET_FINGERPRINTS — 32-char hex, header/footer only */
  fingerprint: string
  version: string
  /** ISO timestamp of dataset generation */
  generated: string
}

export interface DatasetStats {
  entries: number
  languages: number
  regions: number
}

/* ── Signature pools (50 unique values each) ── */

export const DATASET_IDS: readonly string[] = [
  'DS-62WG-GF',
  'DS-KE7G-48',
  'DS-7MDZ-XN',
  'DS-JUHH-EL',
  'DS-WJDL-WC',
  'DS-8USJ-LF',
  'DS-PB6B-9X',
  'DS-M76N-FV',
  'DS-AKWA-FM',
  'DS-UNFY-4L',
  'DS-X5TD-Y8',
  'DS-NNKE-3G',
  'DS-XJTS-ZH',
  'DS-W5HR-QR',
  'DS-MDPY-TR',
  'DS-2MCG-9Q',
  'DS-XZFX-FK',
  'DS-CKNZ-QL',
  'DS-UZQX-Q9',
  'DS-CTAS-BA',
  'DS-PXJF-F6',
  'DS-FLU9-DT',
  'DS-QU47-ST',
  'DS-LBWA-TK',
  'DS-VKZV-XK',
  'DS-Z5A8-KL',
  'DS-XSXE-XT',
  'DS-3ASG-3P',
  'DS-GYFN-W6',
  'DS-QBM8-7L',
  'DS-DEKX-C3',
  'DS-6PJ4-ND',
  'DS-SA5Z-MV',
  'DS-D2CC-KQ',
  'DS-5YWB-XK',
  'DS-WU8A-5L',
  'DS-DZYD-FU',
  'DS-8X8X-QJ',
  'DS-L42F-P8',
  'DS-HMV3-6C',
  'DS-GGSE-DD',
  'DS-NMMA-N5',
  'DS-L8Y6-G4',
  'DS-7UN6-7N',
  'DS-5CPR-YC',
  'DS-MZGJ-N7',
  'DS-PKRV-W6',
  'DS-P8PB-DN',
  'DS-K23A-G8',
  'DS-7RXM-ZW',
]

export const DATASET_FINGERPRINTS: readonly string[] = [
  'f0908c5be0ee82ee070067e0c23b3400',
  '035b56c925454f51910775600e6ed970',
  'db924b83f13a7236fdf7ac097095a130',
  '55dbb48d301152be837793595ba59916',
  '0a3d7c2fe2dd23c6424d50c6cc672ac1',
  '4fa963cb15089ba765d50b5a864f78c9',
  'd382d3fa9fb04f57e58d669a34909061',
  'e57b405e958261b3fae1c5ae0cfb33fb',
  '363126701ffc5483856a580dbbbe3623',
  '16b28c4419fb24d73e3a4a0eaa4268a2',
  '10943d741dce779e3f4852620fb38040',
  '92163503048c7f7664d10acbdb3a8d52',
  'dc19b09469a558f36cfec3e0e7fd16fe',
  '729a3eae558efb515dbf04506c726151',
  '9bf4872bef44fcdd9bf8f44502934351',
  'c14e424f7d76506361ea36e51379de19',
  '840c227fe30792823b63df5c69ba2f61',
  '00fe702c97bf9ee556ecf5f9bde80904',
  'a7c70660921722d149b215a8f12dea21',
  '976fd26f230c5fba483af50e59339a4f',
  '92484b1e3f4a8876307089b1981a599e',
  '08feeba9d57d082147985151bc134674',
  '679ea6a8468c2f0d39f1ec071a59dc07',
  '575dd4504319bd1e980ab5155445bb6e',
  'bf4d1ddf660748bc76e9030a05795619',
  '80af5397ed64c51ae5dc3f116503883a',
  '940bee1e44a8f535a56c7758c81c574d',
  '8d2161b8d45cd475f844c002d04e02ec',
  '8659417b494cdd875385836b099eab06',
  'a2e60e9a265096a9f7bbe54bbac6b70f',
  '6dca3c5f84c048410b2f08f34da9e6db',
  '03610ed04278ee5ea76ac0b652554a32',
  '4a9aacd94347f783318dd01f60531ddf',
  '668a60a3c1cd43f68f57307e06b627b8',
  '438076e5acf7c1b14c87afb35b37b868',
  'f86822916352f80de345a6016d053170',
  '303efbe710cd2449c53838997e6ef48d',
  '23fb5c32fb9c8adca62b1b87a87c7de5',
  'bd5454f0115153b7d882ca66ae174946',
  '2d042099487e41524217045cbac4241a',
  '1eaf4c0b8710f0167435f16c559e164b',
  '0579e32860c65b88632de80769164ebc',
  'fcc5e15758a3405480488502e7cc527b',
  'e282071b3b77f2e78516a3d5969190d3',
  'eb40c934c3faaa6ebc821126b8f04fca',
  'f44894ba8d1e16b45510326ab054aff9',
  '704894d8369835085189dbce2fcf60da',
  '738ef3525ee6fdfedec022e8c5240565',
  'b6b6f79e58b58a5f8ce8dc2274e8943c',
  '22c0c9bbfb49f2463e457bbf31ce59bd',
]

const DATASET_VERSION = '1.0'

/* ── Structural decoration constants ── */

const HEAVY_LINE = '# ' + '═'.repeat(79)
const LIGHT_LINE = '# ' + '─'.repeat(79)

/** True for structural comment lines (start with "#" after trim). */
export function isDatasetCommentLine(line: string): boolean {
  return line.trimStart().startsWith('#')
}

/** Draws one random ID + one random fingerprint. Called once per dataset. */
export function generateDatasetSignature(): DatasetSignature {
  const id = DATASET_IDS[Math.floor(Math.random() * DATASET_IDS.length)]
  const fingerprint = DATASET_FINGERPRINTS[Math.floor(Math.random() * DATASET_FINGERPRINTS.length)]
  return { id, fingerprint, version: DATASET_VERSION, generated: new Date().toISOString() }
}

/** Stamps an entry with the `_dataset_sig` field (drawn ID), preserving key order. */
export function signEntry<T extends Record<string, unknown>>(entry: T, sig: DatasetSignature): T & { _dataset_sig: string } {
  return { _dataset_sig: sig.id, ...entry }
}

/** Lightweight stats for header/footer lines. */
export function computeStats(data: Array<Record<string, unknown>>): DatasetStats {
  const languages = new Set<string>()
  const regions = new Set<string>()
  data.forEach(item => {
    if (item.language_code) languages.add(String(item.language_code))
    if (item.region) regions.add(String(item.region))
  })
  return { entries: data.length, languages: languages.size, regions: regions.size }
}

/* ── JSONL structure builders ── */

export function buildJSONLHeader(sig: DatasetSignature, stats: DatasetStats): string {
  return [
    HEAVY_LINE,
    `# DATASET FORMAT v${sig.version} | ID: ${sig.id} | Fingerprint: ${sig.fingerprint}`,
    `# Generated: ${sig.generated} | Entries: ${stats.entries} | Languages: ${stats.languages} | Regions: ${stats.regions}`,
    HEAVY_LINE,
  ].join('\n')
}

export function buildJSONLSeparator(): string {
  return LIGHT_LINE
}

export function buildJSONLFooter(sig: DatasetSignature, stats: DatasetStats): string {
  return [
    HEAVY_LINE,
    `# DATASET FOOTER | Entries: ${stats.entries} | Languages: ${stats.languages} | ID: ${sig.id} | Fingerprint: ${sig.fingerprint}`,
    HEAVY_LINE,
  ].join('\n')
}

/* ── CSV structure builders (single-line comment metadata) ── */

export function buildCSVHeaderLine(sig: DatasetSignature, stats: DatasetStats): string {
  return `# DATASET_v${sig.version}|ID:${sig.id}|FP:${sig.fingerprint}|Generated:${sig.generated}|Entries:${stats.entries}|Languages:${stats.languages}`
}

export function buildCSVFooterLine(sig: DatasetSignature, stats: DatasetStats): string {
  return `# DATASET_FOOTER|entries:${stats.entries}|languages:${stats.languages}|id:${sig.id}|fingerprint:${sig.fingerprint}`
}

/* ── JSON wrapper builder ── */

/** Wraps dataset entries in the `{ _dataset_meta, data }` envelope. */
export function buildJSONWrapper(data: Array<Record<string, unknown>>, sig: DatasetSignature): Record<string, unknown> {
  return {
    _dataset_meta: {
      format: 'dataset-json',
      version: sig.version,
      id: sig.id,
      fingerprint: sig.fingerprint,
      generated: sig.generated,
      statistics: computeStats(data),
    },
    data: data.map(item => signEntry(item, sig)),
  }
}
