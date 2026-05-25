#CT1
def no_room_double_booking(schedule):
    """
    HARD CONSTRAINT
    No two exams can be held in the same room at the same time.

    How it works:
        For each assignment, creates a key of (room_id, slot_id).
        If any two assignments share this key, that room is double-booked.

    Returns:
        int: number of room double-booking violations
    """
    violations = 0
    
    # create a record to track which rooms are busy at which times
    seen = {}  

    # go through every exam assignment in the schedule one by one
    for assignment in schedule:
        # Create a unique pair of the Room and the Time Slot
        key = (assignment['room_id'], assignment['slot_id'])

        # Check if this specific room and time are already in our records
        if key in seen:
            # If yes, it's a "Hard Constraint" violation because the room is double-booked
            violations += 1  
        else:
            # If no, record that this room is now occupied by this exam during this slot
            seen[key] = assignment['exam']

    # Return the total count of room booking conflicts found
    return violations

#CT2_part1
def no_student_clash(schedule, conflict_matrix):
    """
    HARD CONSTRAINT
    No student can be in two exams at the same timeslot.

    How it works:
        Groups all exams by their assigned slot_id.
        For each slot, checks every pair of exams in that slot.
        If those two exams share a student (i.e. they are in the
        conflict_matrix), that is one violation.

    Args:
        schedule (list of dict): the full schedule
        conflict_matrix (dict of sets): from build_conflict_matrix()

    Returns:
        int: number of student clash violations
    """
    violations = 0

    # Create a dictionary to organize which exams are happening in each time slot
    slot_to_exams = {}
    
    # Loop through the schedule to group exams by their assigned time slot
    for assignment in schedule:
        slot = assignment['slot_id']
        exam = assignment['exam']
        
        # If the slot isn't in our list yet, initialize it
        if slot not in slot_to_exams:
            slot_to_exams[slot] = []
        
        # Add the exam to the list of exams happening at this time
        slot_to_exams[slot].append(exam)

    # Check every time slot to see if any exams scheduled together have shared students
    for slot, exams_in_slot in slot_to_exams.items():
        n = len(exams_in_slot)
        
        # Compare every possible pair of exams within the same time slot
        for i in range(n):
            for j in range(i + 1, n):
                a = exams_in_slot[i]
                b = exams_in_slot[j]
                
                # Use the conflict matrix to see if these two exams share any students
                if b in conflict_matrix.get(a, set()):
                    # If they do, it's a conflict; increase the violation count
                    violations += 1

    # Return the total number of student schedule overlaps found
    return violations


#CT2_part2
def one_exam_per_student_per_day(schedule, conflict_matrix, timeslots):
    """
    HARD CONSTRAINT
    Each student must have at most one exam per day.

    How it works:
        Builds a mapping of slot_id → date.
        Groups exams by date.
        For each day, checks all pairs of exams scheduled that day.
        If two exams on the same day share a student, that is a violation.

    Args:
        schedule (list of dict): the full schedule
        conflict_matrix (dict of sets): from build_conflict_matrix()
        timeslots (list of dict): from load_timeslots()

    Returns:
        int: number of same-day student conflict violations
    """
    violations = 0

    # Create a quick lookup dictionary to link each Time Slot ID to its specific Date
    slot_to_date = {ts['slot_id']: ts['date'] for ts in timeslots}

    # Create a dictionary to group all exams by the date they are scheduled
    date_to_exams = {}
    for assignment in schedule:
        # Identify the date for this specific assignment
        d    = slot_to_date[assignment['slot_id']]
        exam = assignment['exam']
        
        # If this date isn't in our record yet, start a new list for it
        if d not in date_to_exams:
            date_to_exams[d] = []
        
        # Add the exam to the list of exams happening on this date
        date_to_exams[d].append(exam)

    # Check every single day to see if any exams scheduled that day share students
    for day, exams_on_day in date_to_exams.items():
        n = len(exams_on_day)
        
        # Compare every pair of exams scheduled on this same day
        for i in range(n):
            for j in range(i + 1, n):
                a = exams_on_day[i]
                b = exams_on_day[j]
                
                # Use the conflict matrix to see if these two exams have overlapping students
                if b in conflict_matrix.get(a, set()):
                    # If they share students, it's a violation of the "one exam per day" rule
                    violations += 1

    # Return the total number of same-day student conflicts
    return violations


#CT3
def exams_spread_evenly(schedule, timeslots):
    """
    SOFT CONSTRAINT
    Exams should be spread across the full exam period, not
    all clustered on the first few days.

    How it works:
        Counts how many exams are on each day.
        Calculates the ideal number per day (total exams / working days).
        Penalizes days that are more than 2 exams above the ideal.

    Returns:
        int: number of overloaded days (each counts as 1 violation)
    """
    violations = 0

    # Create a lookup dictionary to see which date corresponds to each time slot ID
    slot_to_date = {ts['slot_id']: ts['date'] for ts in timeslots}
    
    # Create a dictionary to count how many exams are happening on each specific day
    day_counts   = {}

    # Go through every assigned exam in the schedule
    for assignment in schedule:
        # Identify the date for the current exam and update that day's total count
        d = slot_to_date[assignment['slot_id']]
        day_counts[d] = day_counts.get(d, 0) + 1

    # Find the total number of working days in the entire exam period
    total_days = len(set(slot_to_date.values()))
    
    # Calculate the "ideal" average number of exams that should happen per day
    ideal      = len(schedule) / total_days

    # Look at the exam count for every day
    for day, count in day_counts.items():
        # If a day has significantly more exams than the average (more than 2 extra)
        if count > ideal + 2:
            # Mark this as an "overloaded" day (Soft Constraint violation)
            violations += 1

    # Return the total number of days that are too crowded
    return violations


#CT4
def assign_rooms_to_exam(exam_code, exams, available_rooms):
    """
    HARD CONSTRAINT
    Assigns one or more rooms to a single exam based on student count.
 
    How it works:
        Checks if all students fit in one room.
        If yes, that room is assigned and we are done.
        If no, students are split across multiple rooms, filling the
        largest rooms first, until every student has a seat.
 
    Args:
        exam_code       (str):        the course code, e.g. 'ACCT201'
        exams           (dict):       output of load_exams(); each entry
                                      has 'num' and 'students'
        available_rooms (list of dict): rooms free in the target timeslot,
                                        each with 'room_id' and 'capacity'
 
    Returns:
        list of dict: one entry per room used, e.g.
            [
                {'room_id': '104', 'students': ['s1', ..., 's80']},
                {'room_id': 'F9',  'students': ['s81', ..., 's120']},
            ]
        Returns an empty list when no rooms are available at all.
 
    Raises:
        ValueError: if total seats across all available rooms are still
                    not enough to seat every student.
    """
    student_list  = exams[exam_code]['students']
    total_needed  = len(student_list)
 
    # Edge case: no rooms were passed in at all
    if not available_rooms:
        return []
 
    # Sort rooms largest-first to minimise the number of rooms used
    sorted_rooms = sorted(available_rooms, key=lambda r: r['capacity'], reverse=True)
 
    # ── Fast path: all students fit in one room ────────────────────────────────
    if sorted_rooms[0]['capacity'] >= total_needed:
        chosen = sorted_rooms[0]
        return [{'room_id': chosen['room_id'], 'students': student_list}]
 
    # ── Slow path: split students across multiple rooms ────────────────────────
    # Verify there are enough total seats before we start slicing
    total_seats = sum(r['capacity'] for r in sorted_rooms)
    if total_seats < total_needed:
        raise ValueError(
            f"Not enough room capacity for '{exam_code}': "
            f"need {total_needed} seats but only {total_seats} available "
            f"across {len(sorted_rooms)} room(s)."
        )
 
    result             = []
    remaining_students = list(student_list)  # copy so we can slice safely
 
    for room in sorted_rooms:
        # Stop as soon as every student has been placed
        if not remaining_students:
            break
 
        # Take as many students as this room can hold
        chunk              = remaining_students[:room['capacity']]
        remaining_students = remaining_students[room['capacity']:]
 
        result.append({
            'room_id':  room['room_id'],
            'students': chunk,
        })
 
    return result


#Hard Violations
def hard_violations(schedule, conflict_matrix, exams, rooms):
    """
    Runs every HARD constraint and returns the total violation count.
 
    Hard constraints (must never be broken):
        CT1 — no_room_double_booking
        CT2 — no_student_clash
        CT4 — checks that every exam has a 'rooms' key (CT4 was run)
               and that no room chunk seats more students than its capacity
 
    Args:
        schedule        (list of dict): the full schedule
        conflict_matrix (dict of sets): from build_conflict_matrix()
        exams           (dict):         from load_exams()
        rooms           (list of dict): from load_rooms()
 
    Returns:
        int: total number of hard violations
    """
    total = 0
 
    # CT1: no room may be used by two exams at the same time
    total += no_room_double_booking(schedule)
 
    # CT2: no student may sit two exams in the same timeslot
    total += no_student_clash(schedule, conflict_matrix)
 
    # CT4: every exam must have been assigned rooms via assign_rooms_to_exam(),
    #      and no individual room chunk may exceed that room's capacity
    room_capacity = {r['room_id']: r['capacity'] for r in rooms}
 
    for assignment in schedule:
        # If the 'rooms' key is missing, CT4 was never run for this exam
        if 'rooms' not in assignment:
            total += 1
            continue
 
        # Check each room chunk for overflow
        for chunk in assignment['rooms']:
            if len(chunk['students']) > room_capacity.get(chunk['room_id'], 0):
                total += 1
 
    return total


#Soft Violations
def soft_violations(schedule, conflict_matrix, timeslots):
    """
    Runs every SOFT constraint and returns the total violation count.
 
    Soft constraints (preferences, not hard rules):
        CT2b — one_exam_per_student_per_day
        CT3  — exams_spread_evenly
 
    Args:
        schedule        (list of dict): the full schedule
        conflict_matrix (dict of sets): from build_conflict_matrix()
        timeslots       (list of dict): from load_timeslots()
 
    Returns:
        int: total number of soft violations
    """
    total = 0
 
    # CT2b: a student should ideally sit at most one exam per calendar day
    total += one_exam_per_student_per_day(schedule, conflict_matrix, timeslots)
 
    # CT3: exams should not all cluster on the same days
    total += exams_spread_evenly(schedule, timeslots)
 
    return total


#Explain Violations
def explain_violations(schedule, conflict_matrix, exams, rooms, timeslots):
    """
    Prints a human-readable breakdown of all violations in a schedule.
    Useful for debugging and for the final report.
 
    Args:
        schedule        (list of dict): one complete exam schedule
        conflict_matrix (dict of sets): from build_conflict_matrix()
        exams           (dict):         from load_exams()
        rooms           (list of dict): from load_rooms()
        timeslots       (list of dict): from load_timeslots()
 
    Prints a detailed report to the console.
    """
    # ── Hard constraints ───────────────────────────────────────────────────────
    # CT1: count how many rooms were double-booked
    v1 = no_room_double_booking(schedule)
 
    # CT2: count how many students were clashed in the same timeslot
    v2 = no_student_clash(schedule, conflict_matrix)
 
    # CT4: count room assignment violations (missing split or overflow)
    room_capacity = {r['room_id']: r['capacity'] for r in rooms}
    v4 = 0
    for assignment in schedule:
        if 'rooms' not in assignment:
            v4 += 1
            continue
        for chunk in assignment['rooms']:
            if len(chunk['students']) > room_capacity.get(chunk['room_id'], 0):
                v4 += 1
 
    # ── Soft constraints ───────────────────────────────────────────────────────
    # CT2b: count how many students had two exams on the same day
    v3 = one_exam_per_student_per_day(schedule, conflict_matrix, timeslots)
 
    # CT3: count how many days were overloaded with exams
    v5 = exams_spread_evenly(schedule, timeslots)
 
    # ── Totals and score ───────────────────────────────────────────────────────
    total_hard = v1 + v2 + v4
    total_soft = v3 + v5
    score      = -((total_hard * 100) + total_soft)
 
    # ── Report ─────────────────────────────────────────────────────────────────
    # Print a formatted header for the schedule quality report
    print("=" * 50)
    print("SCHEDULE VIOLATION REPORT")
    print("=" * 50)
    print()
 
    # Display the specific count for each hard rule that was broken
    print("HARD CONSTRAINTS (penalty: 100 each)")
    print(f"  Room double-bookings            : {v1}")
    print(f"  Student clashes (same timeslot) : {v2}")
    print(f"  Room assignment violations (CT4): {v4}")
    print(f"  Total hard violations           : {total_hard}")
    print()
 
    # Display the specific count for each soft rule that was broken
    print("SOFT CONSTRAINTS (penalty: 1 each)")
    print(f"  Students with 2 exams in one day: {v3}")
    print(f"  Uneven day distribution         : {v5}")
    print(f"  Total soft violations           : {total_soft}")
    print()
 
    # Print the grand total and the final fitness score
    print(f"  Total violations                : {total_hard + total_soft}")
    print(f"  Score                           : {score}  (0 = perfect)")
    print("=" * 50)