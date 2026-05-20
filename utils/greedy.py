import time
import json
import csv
import matplotlib.pyplot as plt
from collections import defaultdict



# GREEDY SCHEDULER

def greedy_schedule(exams, rooms, timeslots, conflict_matrix):
    """
    Simple Greedy Scheduler

    Strategy:
    - Sort exams by number of conflicts (highest first)
    - Try earliest available timeslot
    - Try first available room
    - Avoid student clashes and room double booking
    """

    # Sort exams by how many conflicts they have
    exam_order = sorted(
        exams.keys(),   
        key=lambda e: len(conflict_matrix.get(e, set())),
        reverse=True
    )

    schedule = []
    used_rooms = set()

    for exam in exam_order:
        assigned = False

        for slot in timeslots:
            slot_id = slot['slot_id']

            # Exams already inside this slot
            exams_in_slot = [
                x['exam'] for x in schedule
                if x['slot_id'] == slot_id
            ]

            # Check student conflicts
            has_conflict = False
            for existing_exam in exams_in_slot:
                if existing_exam in conflict_matrix.get(exam, set()):
                    has_conflict = True
                    break

            if has_conflict:
                continue

            # Try rooms
            for room in rooms:
                room_id = room['room_id']

                key = (room_id, slot_id)

                if key in used_rooms:
                    continue

                # Assign exam
                schedule.append({
                    'exam': exam,
                    'room_id': room_id,
                    'slot_id': slot_id
                })

                used_rooms.add(key)
                assigned = True
                break

            if assigned:
                break

    return schedule



# COMPUTE METRICS

def compute_metrics(schedule, rooms, timeslots, conflict_matrix):
    """
    Computes statistics about the schedule.
    """

    start_time = time.time()

    room_conflicts = 0
    student_conflicts = 0

    
    # ROOM DOUBLE BOOKING

    used = {}

    for item in schedule:
        key = (item['room_id'], item['slot_id'])

        if key in used:
            room_conflicts += 1
        else:
            used[key] = item['exam']

    # STUDENT CONFLICTS

    slot_to_exams = defaultdict(list)

    for item in schedule:
        slot_to_exams[item['slot_id']].append(item['exam'])

    for exams_in_slot in slot_to_exams.values():
        for i in range(len(exams_in_slot)):
            for j in range(i + 1, len(exams_in_slot)):
                a = exams_in_slot[i]
                b = exams_in_slot[j]

                if b in conflict_matrix.get(a, set()):
                    student_conflicts += 1

    # UTILIZATION

    used_rooms_count = len(set(x['room_id'] for x in schedule))
    used_slots_count = len(set(x['slot_id'] for x in schedule))

    room_utilization = used_rooms_count / len(rooms)
    slot_utilization = used_slots_count / len(timeslots)

    # SCORE

    total_penalty = room_conflicts + student_conflicts
    score = 100000 - (total_penalty * 1000)

    execution_time = round(time.time() - start_time, 4)

    return {
        'room_conflicts': room_conflicts,
        'student_conflicts': student_conflicts,
        'total_penalty': total_penalty,
        'room_utilization': round(room_utilization, 2),
        'slot_utilization': round(slot_utilization, 2),
        'score': score,
        'execution_time': execution_time
    }


# COMPARE ALGORITHMS

def compare_algorithms(ga_metrics, greedy_metrics):
    """
    Compare Genetic Algorithm with Greedy.
    """

    report = {
        'GA Score': ga_metrics['score'],
        'Greedy Score': greedy_metrics['score'],
        'GA Conflicts': ga_metrics['total_penalty'],
        'Greedy Conflicts': greedy_metrics['total_penalty'],
        'GA Execution Time': ga_metrics['execution_time'],
        'Greedy Execution Time': greedy_metrics['execution_time']
    }

    if ga_metrics['score'] > greedy_metrics['score']:
        report['Winner'] = 'Genetic Algorithm'
    elif ga_metrics['score'] < greedy_metrics['score']:
        report['Winner'] = 'Greedy Algorithm'
    else:
        report['Winner'] = 'Tie'

    return report


# PLOT CONVERGENCE

def plot_convergence(history):
    """
    Plot GA fitness improvement over generations.
    """

    plt.figure(figsize=(10, 5))
    plt.plot(history)

    plt.title('GA Fitness Convergence')
    plt.xlabel('Generation')
    plt.ylabel('Fitness')

    plt.grid(True)
    plt.tight_layout()
    plt.show()


# EXPORT RESULTS

def export_results(schedule, filename='greedy_schedule.json', format='json'):
    """
    Export schedule results.
    """

    if format == 'json':
        with open(filename, 'w') as f:
            json.dump(schedule, f, indent=4)

    elif format == 'csv':
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(
                f,
                fieldnames=['exam', 'room_id', 'slot_id']
            )

            writer.writeheader()
            writer.writerows(schedule)


# EXAMPLE USAGE

if __name__ == '__main__':
    from utils.data_loader import (
        load_exams,
        load_rooms,
        load_timeslots,
        build_conflict_matrix
    )

    exams = load_exams('Data/data.csv')
    rooms = load_rooms('Data/rooms.csv')
    timeslots = load_timeslots()

    conflict_matrix = build_conflict_matrix(exams)

    greedy_result = greedy_schedule(
        exams,
        rooms,
        timeslots,
        conflict_matrix
    )

    metrics = compute_metrics(
        greedy_result,
        rooms,
        timeslots,
        conflict_matrix
    )

    print('\n=== GREEDY METRICS ===')
    print(metrics)

    export_results(
        greedy_result,
        filename='outputs/greedy_schedule.json',
        format='json'
    )