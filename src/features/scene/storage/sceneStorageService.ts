import type { Edge } from 'reactflow';

import type { SceneNode } from '../../../types/scene';
import type { SceneSnapshot } from '../../../types/storage';
import { SCENE_SNAPSHOT_VERSION } from '../../../types/storage';
import {
  createSceneSnapshot,
  parseSceneSnapshot,
  type ParsedSceneSnapshot,
} from '../../../utils/sceneData';

export const SCENE_SNAPSHOT_DOWNLOAD_FILENAME = 'novel-node-editor-scene.json';
export const SCENE_SNAPSHOT_MIME_TYPE = 'application/json';

export class SceneSnapshotError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SceneSnapshotError';
  }
}

export class SceneSnapshotFileReadError extends SceneSnapshotError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SceneSnapshotFileReadError';
  }
}

export class SceneSnapshotInvalidFormatError extends SceneSnapshotError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SceneSnapshotInvalidFormatError';
  }
}

export class SceneSnapshotVersionMismatchError extends SceneSnapshotError {
  readonly expected: number;
  readonly actual: unknown;

  constructor(expected: number, actual: unknown, options?: ErrorOptions) {
    super('Scene snapshot version mismatch.', options);
    this.name = 'SceneSnapshotVersionMismatchError';
    this.expected = expected;
    this.actual = actual;
  }
}

const serializeSceneSnapshot = (snapshot: SceneSnapshot): string =>
  JSON.stringify(snapshot, null, 2);

export const saveSnapshotToBlob = (nodes: SceneNode[], edges: Edge[]): Blob => {
  const snapshot = createSceneSnapshot(nodes, edges);
  const serializedSnapshot = serializeSceneSnapshot(snapshot);
  return new Blob([serializedSnapshot], { type: SCENE_SNAPSHOT_MIME_TYPE });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const parseSnapshotText = (text: string): ParsedSceneSnapshot => {
  let rawSnapshot: unknown;

  try {
    rawSnapshot = JSON.parse(text) as SceneSnapshot;
  } catch (error) {
    throw new SceneSnapshotInvalidFormatError('Snapshot file is not valid JSON.', {
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (!isRecord(rawSnapshot)) {
    throw new SceneSnapshotInvalidFormatError('Snapshot payload must be an object.');
  }

  if (rawSnapshot.version !== SCENE_SNAPSHOT_VERSION) {
    throw new SceneSnapshotVersionMismatchError(
      SCENE_SNAPSHOT_VERSION,
      rawSnapshot.version,
    );
  }

  const parsed = parseSceneSnapshot(rawSnapshot);

  if (!parsed) {
    throw new SceneSnapshotInvalidFormatError('Snapshot payload is not compatible.');
  }

  return parsed;
};

export const readSnapshotFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const { result } = reader;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }

      reject(new SceneSnapshotFileReadError('Unexpected file reader result.'));
    };

    reader.onerror = () => {
      reject(
        new SceneSnapshotFileReadError('Failed to read snapshot file.', {
          cause: reader.error ?? undefined,
        }),
      );
    };

    reader.readAsText(file);
  });

export const parseSnapshotFile = async (file: File): Promise<ParsedSceneSnapshot> => {
  const text = await readSnapshotFileAsText(file);
  return parseSnapshotText(text);
};
