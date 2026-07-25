import { createHash } from 'node:crypto';
import zlib from 'node:zlib';

/**
 * Dictionary-Compressed Zstandard, RFC 9842 §5: a 40-byte zstd skippable frame
 * (magic 0x184D2A5E, payload length 32) carrying the SHA-256 of the dictionary,
 * followed by a regular zstd frame compressed with that dictionary.
 */
const MAGIC = Buffer.from([0x5e, 0x2a, 0x4d, 0x18, 0x20, 0x00, 0x00, 0x00]);

export const DCZ_HEADER_SIZE = 40;

/**
 * Clients must support a window of at least 8 MB and the frame window has to stay
 * below that limit, so dictionary + payload must fit into 4 MB.
 */
export const WINDOW_LOG = 22;
export const MAX_WINDOW_SIZE = 2 ** WINDOW_LOG;

/** zstd with an external dictionary landed in Node 22.19 / 24.6. */
export const isZstdAvailable = typeof zlib.zstdCompressSync === 'function';

export const sha256 = (data) => createHash('sha256').update(data).digest();

/**
 * The dictionary is passed as a plain buffer on purpose: Chromium loads it with
 * ZSTD_dct_rawContent, so a trained dictionary (which writes its dictID into the
 * frame header) would fail to decode on the client.
 */
export const encodeDcz = (data, dictionary, level = 19) =>
    Buffer.concat([
        MAGIC,
        sha256(dictionary),
        zlib.zstdCompressSync(data, {
            dictionary,
            params: {
                [zlib.constants.ZSTD_c_compressionLevel]: level,
                [zlib.constants.ZSTD_c_windowLog]: WINDOW_LOG,
            },
        }),
    ]);

export const decodeDcz = (stream, dictionary) => {
    if (!stream.subarray(0, MAGIC.length).equals(MAGIC)) {
        throw new Error('Not a dcz stream: unexpected magic number');
    }

    const hash = stream.subarray(MAGIC.length, DCZ_HEADER_SIZE);

    if (!hash.equals(sha256(dictionary))) {
        throw new Error('dcz stream was compressed with a different dictionary');
    }

    return zlib.zstdDecompressSync(stream.subarray(DCZ_HEADER_SIZE), { dictionary });
};

/** Mirrors the nginx location regex — keep both in sync. */
export const ASSET_NAME_RE = /^(?<family>.+?)[.-](?<hash>[A-Za-z0-9_-]{8})\.(?<ext>js|css)$/;

export const parseAssetName = (name) => name.match(ASSET_NAME_RE)?.groups ?? null;

/**
 * The original extension stays last so that nginx resolves the Content-Type of the
 * variant from it, and `Dictionary-ID` (the dictionary's build hash) is the lookup key.
 */
export const dczVariantName = (targetName, dictHash) =>
    `${targetName}.${dictHash}.dcz.${parseAssetName(targetName).ext}`;
