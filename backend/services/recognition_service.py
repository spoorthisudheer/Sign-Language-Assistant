
"""
SignConnect AI - Sign Recognition Service

Features:
1. Decode webcam images received from frontend.
2. Detect hands using OpenCV and MediaPipe.
3. Extract 21 landmarks for each detected hand.
4. Return actual landmark coordinates to Flask.
5. Prepare the pipeline for future ML model integration.
"""

import base64
import logging

import cv2
import mediapipe as mp
import numpy as np

logger = logging.getLogger(__name__)


# --------------------------------------------------
# MEDIAPIPE INITIALIZATION
# --------------------------------------------------

_mp_hands = None
_mp_drawing = None
_hands_detector = None

try:
    _mp_hands = mp.solutions.hands
    _mp_drawing = mp.solutions.drawing_utils

    _hands_detector = _mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.5
    )

    logger.info("MediaPipe hand detection initialized successfully.")

except Exception as e:
    logger.exception("MediaPipe initialization failed: %s", e)


# --------------------------------------------------
# DECODE WEBCAM IMAGE
# --------------------------------------------------

def decode_base64_image(image_data_str: str):
    """
    Convert a Base64 webcam image into an OpenCV image.
    """

    if not image_data_str:
        return None

    try:
        # Remove data URI header if present
        if "," in image_data_str:
            image_data_str = image_data_str.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data_str)

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        return image

    except Exception as e:
        logger.error("Image decoding failed: %s", e)
        return None


# --------------------------------------------------
# EXTRACT HAND LANDMARKS
# --------------------------------------------------

def extract_hand_landmarks(cv_image):
    """
    Detect hands and extract 21 landmarks per hand.

    Each landmark contains normalized x, y and z coordinates.
    """

    if cv_image is None:
        return {
            "detected": False,
            "hand_count": 0,
            "landmarks": []
        }

    if _hands_detector is None:
        return {
            "detected": False,
            "hand_count": 0,
            "landmarks": [],
            "message": "MediaPipe is not initialized."
        }

    try:
        # OpenCV uses BGR; MediaPipe expects RGB
        rgb_image = cv2.cvtColor(
            cv_image,
            cv2.COLOR_BGR2RGB
        )

        results = _hands_detector.process(rgb_image)

        extracted_hands = []

        if results.multi_hand_landmarks:

            for hand_landmarks in results.multi_hand_landmarks:

                points = []

                for landmark in hand_landmarks.landmark:

                    points.append({
                        "x": round(landmark.x, 5),
                        "y": round(landmark.y, 5),
                        "z": round(landmark.z, 5)
                    })

                extracted_hands.append(points)

        return {
            "detected": len(extracted_hands) > 0,
            "hand_count": len(extracted_hands),
            "landmarks": extracted_hands
        }

    except Exception as e:

        logger.exception("Hand landmark extraction failed: %s", e)

        return {
            "detected": False,
            "hand_count": 0,
            "landmarks": []
        }


# --------------------------------------------------
# MAIN SIGN PREDICTION FUNCTION
# --------------------------------------------------

def predict_sign(image_base64: str = None, target_sign: str = None):
    """
    Process webcam image and return actual hand landmarks.

    Sign classification will be added after training
    and integrating the machine learning model.
    """

    # Decode frontend webcam image
    cv_image = decode_base64_image(image_base64)

    if cv_image is None:

        return {
            "success": False,
            "mode": "landmark_detection",
            "prediction": None,
            "confidence": 0,
            "landmarks_detected": False,
            "hand_count": 0,
            "landmarks": [],
            "message": "No valid webcam image received."
        }

    # Extract actual MediaPipe landmarks
    landmark_result = extract_hand_landmarks(cv_image)

    detected = landmark_result["detected"]

    return {
        "success": True,
        "mode": "landmark_detection",
        "prediction": None,
        "confidence": 0,
        "landmarks_detected": detected,
        "hand_count": landmark_result["hand_count"],
        "landmarks": landmark_result["landmarks"],
        "message": (
            "Hand landmarks detected successfully."
            if detected
            else "No hand detected. Position your hand inside the camera."
        )
    }