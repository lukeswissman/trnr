import { encodeFit } from './fitEncoder';
import type { WorkoutRecording } from '../../types/recording';

interface ExportFormat {
  encode: (recording: WorkoutRecording) => Uint8Array;
  mimeType: string;
  extension: string;
}

const formats = new Map<string, ExportFormat>();

formats.set('fit', {
  encode: encodeFit,
  mimeType: 'application/octet-stream',
  extension: 'fit',
});

/**
 * Get available export format names.
 */
export function getAvailableFormats(): string[] {
  return [...formats.keys()];
}

/**
 * Export a workout recording by encoding it and triggering a browser download.
 */
export function exportRecording(recording: WorkoutRecording, format: string = 'fit'): void {
  const fmt = formats.get(format);
  if (!fmt) {
    throw new Error(`Unknown export format: ${format}`);
  }

  const bytes = fmt.encode(recording);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: fmt.mimeType });

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

/**
 * Export a workout recording and open Strava's upload page.
 * The user will need to select the downloaded file manually.
 */
export function exportAndUploadToStrava(recording: WorkoutRecording): void {
  exportRecording(recording, 'fit');
  window.open('https://www.strava.com/upload/select', '_blank');
}
