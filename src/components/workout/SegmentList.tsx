import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SegmentEditor } from './SegmentEditor';
import {
  createBlockSegment,
  createRampSegment,
  createRepeatSegment,
} from '../../utils/workoutUtils';
import type { Segment, SegmentType } from '../../types/workout';

interface SegmentListProps {
  segments: Segment[];
  onChange: (segments: Segment[]) => void;
}

export function SegmentList({ segments, onChange }: SegmentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateSegment = (index: number, updated: Segment) => {
    const newSegments = [...segments];
    newSegments[index] = updated;
    onChange(newSegments);
  };

  const deleteSegment = (index: number) => {
    onChange(segments.filter((_, i) => i !== index));
  };

  const addSegment = (type: SegmentType) => {
    let newSegment: Segment;
    if (type === 'block') {
      newSegment = createBlockSegment();
    } else if (type === 'ramp') {
      newSegment = createRampSegment();
    } else {
      newSegment = createRepeatSegment(3, [createBlockSegment()]);
    }
    onChange([...segments, newSegment]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = segments.findIndex((s) => s.id === active.id);
      const newIndex = segments.findIndex((s) => s.id === over.id);

      const newSegments = [...segments];
      const [removed] = newSegments.splice(oldIndex, 1);
      newSegments.splice(newIndex, 0, removed);

      onChange(newSegments);
    }
  };

  // Reversed for display (newest at top)
  const reversedSegments = [...segments].reverse();

  return (
    <div>
      <div className="space-y-2 mb-4">
        {segments.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            Add segments to build your workout
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={reversedSegments.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {reversedSegments.map((segment) => {
                const originalIndex = segments.findIndex((s) => s.id === segment.id);
                return (
                  <SegmentEditor
                    key={segment.id}
                    segment={segment}
                    onChange={(updated) => updateSegment(originalIndex, updated)}
                    onDelete={() => deleteSegment(originalIndex)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => addSegment('block')}
          className="px-3 py-1.5 bg-synth-accent/20 hover:bg-synth-accent/40 border border-synth-accent/50 rounded-lg text-sm"
        >
          + Block
        </button>
        <button
          onClick={() => addSegment('ramp')}
          className="px-3 py-1.5 bg-synth-red/20 hover:bg-synth-red/40 border border-synth-red/50 rounded-lg text-sm"
        >
          + Ramp
        </button>
        <button
          onClick={() => addSegment('repeat')}
          className="px-3 py-1.5 bg-synth-purple/20 hover:bg-synth-purple/40 border border-synth-purple/40 rounded-lg text-sm"
        >
          + Repeat
        </button>
      </div>
    </div>
  );
}
