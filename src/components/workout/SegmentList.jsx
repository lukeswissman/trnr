import { SegmentEditor } from './SegmentEditor.jsx';
import {
  createBlockSegment,
  createRampSegment,
  createRepeatSegment,
} from '../../utils/workoutUtils.js';

export function SegmentList({ segments, onChange }) {
  const updateSegment = (index, updated) => {
    const newSegments = [...segments];
    newSegments[index] = updated;
    onChange(newSegments);
  };

  const deleteSegment = (index) => {
    onChange(segments.filter((_, i) => i !== index));
  };

  const addSegment = (type) => {
    let newSegment;
    if (type === 'block') {
      newSegment = createBlockSegment();
    } else if (type === 'ramp') {
      newSegment = createRampSegment();
    } else if (type === 'repeat') {
      newSegment = createRepeatSegment(3, [createBlockSegment()]);
    }
    onChange([...segments, newSegment]);
  };

  return (
    <div>
      <div className="space-y-2 mb-4">
        {segments.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            Add segments to build your workout
          </p>
        ) : (
          [...segments].reverse().map((segment, reversedIndex) => {
            const originalIndex = segments.length - 1 - reversedIndex;
            return (
              <SegmentEditor
                key={segment.id}
                segment={segment}
                onChange={(updated) => updateSegment(originalIndex, updated)}
                onDelete={() => deleteSegment(originalIndex)}
              />
            );
          })
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => addSegment('block')}
          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600 rounded text-sm"
        >
          + Block
        </button>
        <button
          onClick={() => addSegment('ramp')}
          className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600 rounded text-sm"
        >
          + Ramp
        </button>
        <button
          onClick={() => addSegment('repeat')}
          className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-600 rounded text-sm"
        >
          + Repeat
        </button>
      </div>
    </div>
  );
}
