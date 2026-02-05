import type { DraggableAttributes } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { CSS } from '@dnd-kit/utilities';
import { formatDuration } from '../../utils/workoutUtils';
import type { Segment, BlockSegment, RampSegment, RepeatSegment } from '../../types/workout';

interface SegmentEditorProps {
  segment: Segment;
  onChange: (segment: Segment) => void;
  onDelete: () => void;
  depth?: number;
}

function DragHandle({ listeners, attributes }: { listeners?: SyntheticListenerMap; attributes?: DraggableAttributes }) {
  return (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 touch-none"
      {...listeners}
      {...attributes}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="11" cy="4" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
      </svg>
    </button>
  );
}

export function SegmentEditor({ segment, onChange, onDelete, depth = 0 }: SegmentEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id, disabled: depth > 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const parseDuration = (value: string): number => {
    if (value.includes(':')) {
      const [mins, secs] = value.split(':').map(Number);
      return (mins || 0) * 60 + (secs || 0);
    }
    return parseInt(value, 10) || 0;
  };

  const baseClasses = "bg-synth-purple/10 rounded-lg p-3 border-l-4";
  const typeColors = {
    block: 'border-synth-accent',
    ramp: 'border-synth-red',
    repeat: 'border-synth-purple',
  };

  if (segment.type === 'block') {
    const blockSegment = segment as BlockSegment;
    const updateField = <K extends keyof BlockSegment>(field: K, value: BlockSegment[K]) => {
      onChange({ ...blockSegment, [field]: value });
    };

    return (
      <div ref={setNodeRef} style={style} className={`${baseClasses} ${typeColors.block}`}>
        <div className="flex flex-wrap items-center gap-3">
          {depth === 0 && <DragHandle listeners={listeners} attributes={attributes} />}
          <span className="text-sm text-gray-400 w-16">Block</span>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={blockSegment.power}
              onChange={(e) => updateField('power', parseInt(e.target.value, 10) || 0)}
              className="w-20 px-2 py-1 bg-gray-700 rounded text-right"
              min="0"
              max="2000"
            />
            <span className="text-gray-400 text-sm">W</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={formatDuration(blockSegment.duration)}
              onChange={(e) => updateField('duration', parseDuration(e.target.value))}
              className="w-16 px-2 py-1 bg-gray-700 rounded text-center"
              placeholder="0:00"
            />
          </div>

          <button
            onClick={onDelete}
            className="ml-auto text-gray-500 hover:text-red-500"
            title="Delete segment"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  if (segment.type === 'ramp') {
    const rampSegment = segment as RampSegment;
    const updateField = <K extends keyof RampSegment>(field: K, value: RampSegment[K]) => {
      onChange({ ...rampSegment, [field]: value });
    };

    return (
      <div ref={setNodeRef} style={style} className={`${baseClasses} ${typeColors.ramp}`}>
        <div className="flex flex-wrap items-center gap-3">
          {depth === 0 && <DragHandle listeners={listeners} attributes={attributes} />}
          <span className="text-sm text-gray-400 w-16">Ramp</span>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={rampSegment.startPower}
              onChange={(e) => updateField('startPower', parseInt(e.target.value, 10) || 0)}
              className="w-20 px-2 py-1 bg-gray-700 rounded text-right"
              min="0"
              max="2000"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="number"
              value={rampSegment.endPower}
              onChange={(e) => updateField('endPower', parseInt(e.target.value, 10) || 0)}
              className="w-20 px-2 py-1 bg-gray-700 rounded text-right"
              min="0"
              max="2000"
            />
            <span className="text-gray-400 text-sm">W</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={formatDuration(rampSegment.duration)}
              onChange={(e) => updateField('duration', parseDuration(e.target.value))}
              className="w-16 px-2 py-1 bg-gray-700 rounded text-center"
              placeholder="0:00"
            />
          </div>

          <button
            onClick={onDelete}
            className="ml-auto text-gray-500 hover:text-red-500"
            title="Delete segment"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  if (segment.type === 'repeat') {
    const repeatSegment = segment as RepeatSegment;

    const updateNestedSegment = (index: number, updated: Segment) => {
      const newSegments = [...repeatSegment.segments];
      newSegments[index] = updated;
      onChange({ ...repeatSegment, segments: newSegments });
    };

    const deleteNestedSegment = (index: number) => {
      const newSegments = repeatSegment.segments.filter((_, i) => i !== index);
      onChange({ ...repeatSegment, segments: newSegments });
    };

    const addNestedSegment = (type: 'block' | 'ramp') => {
      const newSegment: Segment =
        type === 'block'
          ? { type: 'block', id: crypto.randomUUID(), power: 100, duration: 60 }
          : { type: 'ramp', id: crypto.randomUUID(), startPower: 100, endPower: 200, duration: 60 };
      onChange({ ...repeatSegment, segments: [...repeatSegment.segments, newSegment] });
    };

    return (
      <div ref={setNodeRef} style={style} className={`${baseClasses} ${typeColors.repeat}`}>
        <div className="flex items-center gap-3 mb-3">
          {depth === 0 && <DragHandle listeners={listeners} attributes={attributes} />}
          <span className="text-sm text-gray-400 w-16">Repeat</span>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={repeatSegment.count}
              onChange={(e) => onChange({ ...repeatSegment, count: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-16 px-2 py-1 bg-gray-700 rounded text-center"
              min="1"
              max="100"
            />
            <span className="text-gray-400 text-sm">times</span>
          </div>

          <button
            onClick={onDelete}
            className="ml-auto text-gray-500 hover:text-red-500"
            title="Delete segment"
          >
            &times;
          </button>
        </div>

        <div className="ml-4 space-y-2">
          {repeatSegment.segments.map((nested, index) => (
            <SegmentEditor
              key={nested.id}
              segment={nested}
              onChange={(updated) => updateNestedSegment(index, updated)}
              onDelete={() => deleteNestedSegment(index)}
              depth={depth + 1}
            />
          ))}

          {depth < 2 && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => addNestedSegment('block')}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
              >
                + Block
              </button>
              <button
                onClick={() => addNestedSegment('ramp')}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
              >
                + Ramp
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
