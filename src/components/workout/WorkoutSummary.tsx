import { useMemo } from 'react';
import type { WorkoutRecording } from '../../types/recording';
import { calculateWorkoutStats } from '../../utils/stats';
import { formatDuration } from '../../utils/workoutUtils';

interface WorkoutSummaryProps {
    recording: WorkoutRecording;
    plannedDuration: number;
    onDone: () => void;
    onSave: () => void;
    onUploadToStrava: () => void;
}

export function WorkoutSummary({ recording, plannedDuration, onDone, onSave, onUploadToStrava }: WorkoutSummaryProps) {
    const stats = useMemo(() => calculateWorkoutStats(recording), [recording]);
    const percentCompleted = Math.min(100, Math.round((recording.totalTimerTime / plannedDuration) * 100));

    return (
        <div className="max-w-2xl mx-auto w-full p-6 space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">Workout Summary</h2>
                <p className="text-gray-400">{recording.workoutName}</p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatBox label="Duration" value={formatDuration(Math.round(stats.totalDuration))} />
                    <StatBox label="Completed" value={`${percentCompleted}%`} />
                    <StatBox label="Avg Power" value={`${stats.avgPower}W`} />
                    <StatBox label="Avg HR" value={stats.avgHeartRate > 0 ? `${stats.avgHeartRate} bpm` : '--'} />
                </div>
            </div>

            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Benchmarks</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-gray-400">Max Power</span>
                        <span className="text-white font-medium">{stats.maxPower}W</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-gray-400">Max HR</span>
                        <span className="text-white font-medium">{stats.maxHeartRate > 0 ? `${stats.maxHeartRate} bpm` : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-gray-400">Avg Cadence</span>
                        <span className="text-white font-medium">{stats.avgCadence > 0 ? `${stats.avgCadence} rpm` : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-gray-400">Intensity</span>
                        <span className="text-white font-medium">{Math.round((stats.avgPower / 200) * 100)}%</span> {/* Mock intensity */}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                    onClick={onSave}
                    className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                >
                    Save .FIT File
                </button>
                <button
                    onClick={onUploadToStrava}
                    className="flex-1 px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-900/20"
                >
                    Upload to Strava
                </button>
                <button
                    onClick={onDone}
                    className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-center space-y-1">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</div>
            <div className="text-2xl font-bold text-blue-400">{value}</div>
        </div>
    );
}
