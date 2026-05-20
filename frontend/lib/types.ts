export type MetricSet = {
  algorithm: string;
  quality_score: number;
  score: number;
  fitness: number;
  total_conflicts: number;
  hard_violations: number;
  soft_violations: number;
  room_conflicts: number;
  student_conflicts: number;
  same_day_conflicts: number;
  room_capacity_violations: number;
  unscheduled_jobs: number;
  jobs_scheduled: number;
  jobs_total: number;
  runtime_seconds: number;
  utilization_percentage: number;
  room_utilization: number;
  slot_utilization: number;
  seat_utilization: number;
};

export type ScheduleRow = {
  exam: string;
  room?: string;
  room_id?: string;
  "total students"?: number;
  "room capacity"?: number;
  "students in room"?: number;
  date: string;
  day: string;
  time: string;
  slot_id?: number;
  algorithm?: string;
  status?: "scheduled" | "conflict";
  priority?: "high" | "normal";
  overflow_students?: number;
};

export type HistoryPoint = {
  generation: number;
  best_fitness: number;
  average_fitness: number;
  hard_violations: number;
  soft_violations: number;
  conflicts: number;
  progress?: number;
};

export type ConstraintItem = {
  name: string;
  description: string;
  severity: "hard" | "soft";
  violations: number;
  satisfied: boolean;
  percentage: number;
};

export type AlgorithmResult = {
  algorithm: "ga" | "greedy";
  metrics: MetricSet;
  schedule: ScheduleRow[];
  constraints: {
    items: ConstraintItem[];
    overall_satisfaction: number;
    conflict_reasons: { type: string; message: string; exam?: string }[];
  };
  analytics: AnalyticsPayload;
  history: HistoryPoint[];
  created_at?: string;
};

export type AnalyticsPayload = {
  fitness_history: HistoryPoint[];
  conflict_reduction: { generation: number; conflicts: number }[];
  room_utilization: { room: string; assignments: number }[];
  day_distribution: { day: string; exams: number }[];
  slot_distribution: { slot: string; exams: number }[];
  runtime: { algorithm: string; seconds: number }[];
  instructor_workload: { instructor: string; exams: number }[];
  recent_runs?: unknown[];
};

export type DatasetSummary = {
  dataset_name: string;
  rows_count: number;
  courses_count: number;
  jobs_count: number;
  rooms_count: number;
  students_count: number;
  instructors_count: number;
  timeslots_count: number;
  conflict_pairs: number;
  total_enrollments: number;
  total_room_capacity: number;
  preview: Record<string, unknown>[];
  rooms_preview: Record<string, unknown>[];
};

export type GAParameters = {
  population_size: number;
  generations: number;
  mutation_rate: number;
  crossover_rate: number;
  elitism_percentage: number;
  tournament_size: number;
  seed: number;
  early_stop_rounds: number;
};

export type StudentScheduleEntry = {
  course: string;
  room: string;
  building: string;
  capacity: number;
  date: string;
  day: string;
  time: string;
  start_time: string;
  end_time: string;
  students_enrolled: number;
  students_seated: number;
  priority: "high" | "normal";
  status: "scheduled" | "conflict";
  overflow: number;
};

export type StudentScheduleResult = {
  found: boolean;
  student_id: string;
  message: string;
  schedule: StudentScheduleEntry[];
  total_courses: number;
  found_courses: number;
  missing_courses: string[];
  conflicts: { course: string; type: string; message: string }[];
  source: string | null;
  algorithm: string;
  schedule_generated: boolean;
};

export type StudentSearchResult = {
  student_id: string;
  courses_count: number;
};

