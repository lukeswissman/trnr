import { encodeFit } from './fitEncoder.js';

/** @type {Map<string, { encode: Function, mimeType: string, extension: string }>} */
const formats = new Map();

formats.set('fit', {
  encode: encodeFit,
  mimeType: 'application/octet-stream',
  extension: 'fit',
});

/**
 * Get available export format names.
 * @returns {string[]}
 */
export function getAvailableFormats() {
  return [...formats.keys()];
}

/**
 * Export a workout recording by encoding it and triggering a browser download.
 * @param {import('../../types/recording.js').WorkoutRecording} recording
 * @param {string} [format='fit']
 */
export function exportRecording(recording, format = 'fit') {
  const fmt = formats.get(format);
  if (!fmt) {
    throw new Error(`Unknown export format: ${format}`);
  }

  const bytes = fmt.encode(recording);
  const blob = new Blob([bytes], { type: fmt.mimeType });

  // Build filename: WorkoutName_YYYY-MM-DD_HHmm.fit
  const date = new Date(recording.startTime * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const safeName = recording.workoutName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_${yyyy}-${mm}-${dd}_${hh}${min}.${fmt.extension}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
