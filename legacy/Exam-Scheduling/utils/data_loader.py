"""
data_loader.py
--------------
Loads and cleans all CSV files into Python objects that the rest
of the project can use. Import this file in any notebook like this:

    import sys
    sys.path.append('..')
    from utils.data_loader import load_exams, load_students, load_rooms, load_timeslots, build_conflict_matrix
"""

import pandas as pd
import pickle
import os
from datetime import date, timedelta


# ─────────────────────────────────────────────
# 1. LOAD EXAMS
# ─────────────────────────────────────────────

def load_exams(path='data/data.csv'):
    """
    Reads data.csv and returns a clean dictionary of exams.

    Returns:
        exams (dict): { 'ACCT201': {'num': 205, 'students': ['211001268', ...]} }
    """
    # Load the dataset using pandas
    df = pd.read_csv(path)

    # Initialize the main dictionary to hold our exam objects
    exams = {}
    
    # Iterate through every row (every unique exam) in the CSV
    for _, row in df.iterrows():
        # Clean the subject name (e.g. 'ACCT201') by removing any accidental spaces
        subject = str(row['Subject']).strip()
        
        # Convert student count to an integer for calculations later
        num = int(row['num'])

        # The 'IDs' column contains student numbers separated by '+'. 
        # We split them into a list and remove whitespace for each individual ID.
        raw_ids = str(row['IDs']).split('+')
        students = [s.strip() for s in raw_ids if s.strip()]

        # Map the subject name to its data (student count and list of student IDs)
        exams[subject] = {
            'num':      num,
            'students': students
        }

    # Print a confirmation message to track progress in the console
    print(f"Loaded {len(exams)} exams.")
    
    return exams



# ─────────────────────────────────────────────
# 2. LOAD STUDENTS
# ─────────────────────────────────────────────

def load_students(path='data/IDs.csv'):
    """
    Reads IDs.csv and returns a clean dictionary of students.

    Returns:
        students (dict): { '211001268': ['ACCT201', 'CSCI217', ...] }

    Each key is a student ID string.
    Each value is a list of course codes that student is enrolled in.
    """
    # Use pandas to load the CSV mapping student IDs to their enrolled subjects
    df = pd.read_csv(path)

    # Initialize a dictionary to store students as keys and their course lists as values
    students = {}
    
    # Process each row in the dataframe individually
    for _, row in df.iterrows():
        # Clean up the Student ID by converting to string and stripping whitespace
        student_id = str(row['ID']).strip()

        # The 'Subject' column contains multiple course codes joined by '+'
        # We split these into a list and strip whitespace from each course code
        raw_subjects = str(row['Subject']).split('+')
        courses = [s.strip() for s in raw_subjects if s.strip()]

        # Save the student's academic record in our main dictionary
        students[student_id] = courses

    # Provide feedback on how many student profiles were successfully processed
    print(f"Loaded {len(students)} students.")
    
    return students



# ─────────────────────────────────────────────
# 3. LOAD ROOMS
# ─────────────────────────────────────────────

def load_rooms(path='data/rooms.csv'):
    """
    Reads rooms.csv and returns a list of room dictionaries.

    Returns:
        rooms (list): [
            {'room_id': '104', 'building': 'Tarek Khalil', 'capacity': 80},
            ...
        ]

    NOTE: You must fill in the capacity column in rooms.csv first.
          Rooms with empty or zero capacity are skipped with a warning.
    """
    # Load the room inventory spreadsheet
    df = pd.read_csv(path)

    # Initialize lists to track usable rooms and those that failed validation
    rooms = []
    skipped = []

    # Iterate through each room entry
    for _, row in df.iterrows():
        cap = row['capacity']

        # Validation: Ensure the room has a defined, non-zero capacity.
        # This prevents the scheduler from trying to put students in a "ghost" room.
        if pd.isna(cap) or str(cap).strip() == '' or int(cap) == 0:
            skipped.append(str(row['room_id']))
            continue

        # Standardize the data: remove whitespace from strings and cast capacity to integer
        rooms.append({
            'room_id':  str(row['room_id']).strip(),
            'building': str(row['building']).strip(),
            'capacity': int(cap)
        })

    # Alert the user if any rooms were discarded so they can fix the CSV if needed
    if skipped:
        print(f"WARNING: {len(skipped)} rooms skipped (no capacity info): {skipped}")

    # Confirmation of total available capacity for the scheduling algorithm
    print(f"Loaded {len(rooms)} usable rooms.")
    
    return rooms



# ─────────────────────────────────────────────
# 4. GENERATE TIMESLOTS
# ─────────────────────────────────────────────

def load_timeslots():
    """
    Generates all valid exam timeslots between 31 May and 16 June 2025.
    Working days: Saturday to Thursday (Friday is off).
    Four 2-hour slots per day: 08-10, 10-12, 12-14, 14-16.

    Returns:
        timeslots (list): List of dictionaries containing slot metadata.
    """
    # Define the daily schedule structure
    slot_times = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00']

    # Define the start and end dates for the final exam period
    start = date(2025, 5, 31)
    end   = date(2025, 6, 16)

    timeslots = []
    slot_id   = 0
    current   = start

    # Iterate through every calendar day in the range
    while current <= end:
        # The weekday() method returns 0 for Monday and 6 for Sunday.
        # Friday is represented by 4. We skip it to respect the weekend.
        if current.weekday() != 4:
            # For every valid working day, create 4 distinct time slots
            for time_block in slot_times:
                timeslots.append({
                    'slot_id': slot_id,
                    'date':    current.strftime('%Y-%m-%d'), # Format as 'YYYY-MM-DD'
                    'day':     current.strftime('%A'),      # Get full name (e.g., 'Saturday')
                    'time':    time_block
                })
                slot_id += 1
        
        # Move to the next calendar day
        current += timedelta(days=1)

    # Log the output to ensure the calendar generation matches academic requirements
    print(f"Generated {len(timeslots)} timeslots across {slot_id // 4} working days.")
    
    return timeslots



# ─────────────────────────────────────────────
# 5. BUILD CONFLICT MATRIX
# ─────────────────────────────────────────────

def build_conflict_matrix(exams, save_path='outputs/conflict_matrix.pkl'):
    """
    For every pair of exams, checks if they share at least one student.
    Stores the result so we never recompute it during the GA.

    This is the most important data structure for constraint checking.
    Two exams that conflict CANNOT be placed in the same timeslot.

    Args:
        exams (dict): output of load_exams()
        save_path (str): where to save the result

    Returns:
        conflict_matrix (dict of sets):
            { 'ACCT201': {'CSCI217', 'MTH112', ...}, ... }
    """
    print("Building conflict matrix (this may take a minute)...")

    # Step 1: Optimization - convert lists to sets.
    # Checking intersection between sets is significantly faster than lists (O(1) vs O(n) average).
    exam_sets = {}
    for course, info in exams.items():
        exam_sets[course] = set(info['students'])

    course_list = list(exams.keys())
    n = len(course_list)

    # Step 2: Initialize empty sets for every course
    conflict_matrix = {course: set() for course in course_list}

    # Step 3: Nested loop to compare every unique pair (Upper Triangle of a matrix)
    checked = 0
    for i in range(n):
        for j in range(i + 1, n):
            a = course_list[i]
            b = course_list[j]

            # If the intersection (&) is not empty, it means at least one student 
            # is enrolled in both exams simultaneously.
            if exam_sets[a] & exam_sets[b]:
                conflict_matrix[a].add(b)
                conflict_matrix[b].add(a)

            checked += 1

    # Statistical summary for verification
    total_pairs    = n * (n - 1) // 2
    conflict_pairs = sum(len(v) for v in conflict_matrix.values()) // 2
    print(f"Checked {total_pairs} exam pairs.")
    print(f"Found {conflict_pairs} conflicting pairs (share at least one student).")

    # Step 4: Serialization
    # We save this to disk because re-calculating this for hundreds of exams 
    # every time we restart the script is inefficient.
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, 'wb') as f:
        pickle.dump(conflict_matrix, f)
    print(f"Conflict matrix saved to {save_path}")

    return conflict_matrix


def load_conflict_matrix(path='outputs/conflict_matrix.pkl'):
    """
    Loads a previously saved conflict matrix from a pickle file.
    Use this to save time after the matrix has been built once.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"No conflict matrix found at {path}. Please run build_conflict_matrix first.")
        
    with open(path, 'rb') as f:
        conflict_matrix = pickle.load(f)
    print(f"Conflict matrix loaded from {path}")
    return conflict_matrix