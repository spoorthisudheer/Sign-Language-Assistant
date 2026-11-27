import cv2
import mediapipe as mp
import csv
import os
import time

DATASET_FILE = os.path.join(
    os.path.dirname(__file__),
    "dataset",
    "sign_data.csv"
)

os.makedirs(os.path.dirname(DATASET_FILE), exist_ok=True)

LABELS = {
    "0": "0",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "A",
    "7": "C",
    "8": "L",
    "9": "V"
}

SAMPLES_PER_SIGN = 100
CAPTURE_INTERVAL = 0.1

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Camera could not be opened.")
    exit()

if not os.path.exists(DATASET_FILE):
    with open(DATASET_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            ["label"] + [f"f{i}" for i in range(126)]
        )

print("SIGNCONNECT AI - AUTOMATIC DATA COLLECTION")
print("Press keys 0-9 to collect 100 samples.")
print("Press Q to quit.")

while True:
    success, frame = camera.read()

    if not success:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if results.multi_hand_landmarks:
        for hand in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(
                frame, hand, mp_hands.HAND_CONNECTIONS
            )

    cv2.putText(
        frame,
        "Press 0-9 to collect | Q to quit",
        (10, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 255, 0),
        2
    )

    cv2.imshow("SignConnect AI", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

    if chr(key) in LABELS:
        label = LABELS[chr(key)]
        collected = 0
        last_capture = 0

        print(f"\nCollecting sign: {label}")

        while collected < SAMPLES_PER_SIGN:
            success, frame = camera.read()

            if not success:
                break

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)

            if results.multi_hand_landmarks:
                for hand in results.multi_hand_landmarks:
                    mp_draw.draw_landmarks(
                        frame, hand, mp_hands.HAND_CONNECTIONS
                    )

                now = time.time()

                if now - last_capture >= CAPTURE_INTERVAL:
                    features = []

                    detected = results.multi_hand_landmarks

                    for i in range(2):
                        if i < len(detected):
                            for point in detected[i].landmark:
                                features.extend([
                                    point.x, point.y, point.z
                                ])
                        else:
                            features.extend([0.0] * 63)

                    with open(DATASET_FILE, "a", newline="") as f:
                        csv.writer(f).writerow([label] + features)

                    collected += 1
                    last_capture = now

            cv2.putText(
                frame,
                f"{label}: {collected}/{SAMPLES_PER_SIGN}",
                (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            cv2.imshow("SignConnect AI", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                collected = SAMPLES_PER_SIGN
                break

        print(f"Completed collection for {label}")

camera.release()
hands.close()
cv2.destroyAllWindows()

print("Data collection finished.")