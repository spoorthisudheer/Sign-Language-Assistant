-- ============================================================================
-- SignConnect AI - Complete MySQL Database Schema & Seed Data
-- Database: signconnect_ai
-- ============================================================================

CREATE DATABASE IF NOT EXISTS signconnect_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE signconnect_ai;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS communication_logs;
DROP TABLE IF EXISTS quiz_results;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Table 1: users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Student / ISL Learner',
  avatar VARCHAR(10) DEFAULT 'SL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 2: lessons
-- ----------------------------------------------------------------------------
CREATE TABLE lessons (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sign VARCHAR(50) NOT NULL,
  description TEXT,
  instructions TEXT,
  image_path VARCHAR(255),
  two_handed BOOLEAN DEFAULT FALSE,
  hand_type VARCHAR(100),
  pronunciation VARCHAR(100),
  variations TEXT,
  non_manual_markers TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lessons_category (category),
  INDEX idx_lessons_sign (sign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 3: user_progress
-- ----------------------------------------------------------------------------
CREATE TABLE user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id VARCHAR(50) NOT NULL,
  completion_status VARCHAR(20) DEFAULT 'completed',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_lesson (user_id, lesson_id),
  CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_user_progress_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 4: quizzes
-- ----------------------------------------------------------------------------
CREATE TABLE quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  sign_id VARCHAR(50) DEFAULT NULL,
  option_a VARCHAR(150) NOT NULL,
  option_b VARCHAR(150) NOT NULL,
  option_c VARCHAR(150) NOT NULL,
  option_d VARCHAR(150) NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quizzes_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 5: quiz_results
-- ----------------------------------------------------------------------------
CREATE TABLE quiz_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  category VARCHAR(50) DEFAULT 'ISL Mixed Quiz',
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_results_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quiz_results_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 6: communication_logs
-- ----------------------------------------------------------------------------
CREATE TABLE communication_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  recognized_sign VARCHAR(50) NOT NULL,
  confidence DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comm_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_comm_logs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- 1. Seed Users (passwords: 'Password@123' and 'Admin@123')
INSERT INTO users (id, name, email, password, role, avatar) VALUES
(1, 'SignConnect Learner', 'learner@signconnect.ai', 'scrypt:32768:8:1$qpweya6s8fvLvbnT$5e1a81d07418569470060e248242d13b748fc7f062e24195cab72a312ac319400362721088d27e701fe4fc50dfcd8d011bfa16e72938c4d9ed348159fe6df5ea', 'Student / ISL Learner', 'SL'),
(2, 'Project Administrator', 'admin@signconnect.ai', 'scrypt:32768:8:1$PzqIkIpI0eb6OmAk$973225f0934e42dbbc2d61424a3892370b0e20f205915e161626a4b8c14728615a6f2b9b8d10c3ae72879bebca51fa02b0e5e2716e1cd8beced97a29036086ef', 'Instructor / Administrator', 'PA');

-- 2. Seed Lessons (48 Official ISL Signs)
INSERT INTO lessons (id, title, category, sign, description, instructions, image_path, two_handed, hand_type, pronunciation, variations, non_manual_markers) VALUES
('a', 'Letter A', 'Alphabets', 'A', 'In Indian Sign Language, Letter A is signed using both hands. The non-dominant hand forms a firm closed fist with thumb upright, while the dominant right fist meets it so both thumbs touch firmly at chest height.', 'Form a solid fist with your non-dominant (left) hand at mid-chest level, thumb pointing upward.
Form a matching fist with your dominant (right) hand.
Bring both hands together until the thumbs touch firmly at their tips, keeping knuckles facing forward.', 'assets/images/isl_a.svg', 1, 'Two-Handed (Dominant + Base Fist)', '/eɪ/ (ay)', 'Primary: Both closed fists touching thumb-to-thumb at chest level. Regional variation: Right fist placed beside upright left thumb.', 'Neutral head, eye gaze directed toward conversation partner.'),
('b', 'Letter B', 'Alphabets', 'B', 'Letter B represents the two rounded lobes of the letter. Both hands are held open flat with fingers close together, palms facing inward and fingertips touching to form the profile of B.', 'Open both hands flat with all four fingers held close together.
Hold hands parallel in front of your chest with palms facing each other.
Bring fingertips together or tap palms gently, forming the visual lobes of ''B''.', 'assets/images/isl_b.svg', 1, 'Two-Handed (Dual Flat Palms)', '/biː/ (bee)', 'Primary: Both hands open flat, palms facing each other and fingertips touching. Variation: Dominant fingertips gently tapping the center of non-dominant flat palm.', 'Neutral face, steady shoulder level.'),
('c', 'Letter C', 'Alphabets', 'C', 'Dominant right hand curves all four fingers and thumb into an open semicircle ''C'' shape. In formal Indian Sign Language, the non-dominant hand cups beneath to support the base.', 'Curve your right fingers and thumb smoothly to form an open ''C'' shape.
Hold palm facing toward your left side so the ''C'' is clearly visible to the viewer.
In formal ISL, cradle the base gently with your left curved palm.', 'assets/images/isl_c.svg', 1, 'Two-Handed Standard (One-Handed Variation Widely Used)', '/siː/ (see)', 'Formal ISL Standard: Dominant hand forms ''C'' arc supported at base by non-dominant cupped palm. Informal Variation: Single-handed ''C'' held clearly facing forward.', 'Clear eye contact with partner.'),
('d', 'Letter D', 'Alphabets', 'D', 'The non-dominant index finger points vertically straight up to represent the vertical stem of ''D'', while the dominant curved thumb and fingers touch the top and base to create the curved belly.', 'Hold your left index finger pointing straight upward (stem of the letter).
Curve your right hand into a semicircle loop.
Touch your right index tip to the top of the left index, and right thumb to the base of the left index.', 'assets/images/isl_d.svg', 1, 'Two-Handed (Index Stem + Curved Arc)', '/diː/ (dee)', 'Standard ISL two-handed representation forming the iconic letter profile.', 'Neutral head alignment, steady hands.'),
('e', 'Letter E', 'Alphabets', 'E', 'Left hand is held sideways with fingers pointing horizontally. The dominant right index finger sweeps across the fingertips, highlighting the three horizontal bars of the letter ''E''.', 'Hold left hand horizontally with index, middle, and ring fingers pointing toward the right.
Extend right index finger.
Touch or sweep across the tips of the three left fingers to indicate the 3 bars of ''E''.', 'assets/images/isl_e.svg', 1, 'Two-Handed (Horizontal Fingers + Index Touch)', '/iː/ (ee)', 'Left hand holds 3 horizontal fingers (index, middle, ring) representing the 3 bars of ''E''; right index touches the tips.', 'Focused gaze on signing space.'),
('f', 'Letter F', 'Alphabets', 'F', 'The left index finger serves as the vertical stem of ''F''. The dominant right index and middle fingers are placed horizontally across it, creating the two horizontal bars.', 'Hold left index finger vertically straight up at chest level.
Hold right index and middle fingers horizontally.
Place right index across the top of left index, and right middle finger across the middle.', 'assets/images/isl_f.svg', 1, 'Two-Handed (Index Stem + Dual Crossbars)', '/ɛf/ (ef)', 'Left index vertical; right index and middle fingers lay horizontally across it to form the crossbars.', 'Neutral facial posture.'),
('g', 'Letter G', 'Alphabets', 'G', 'Both hands are clenched into fists. The dominant right fist is placed directly on top of the non-dominant left fist so the knuckles stack vertically.', 'Make a firm fist with both hands.
Place the non-dominant left fist at lower chest level.
Stack the dominant right fist firmly on top of the left fist, knuckle-to-knuckle.', 'assets/images/isl_g.svg', 1, 'Two-Handed (Stacked Fists)', '/dʒiː/ (jee)', 'Both hands in fists, stacked vertically at chest height.', 'Firm shoulder posture.'),
('h', 'Letter H', 'Alphabets', 'H', 'Non-dominant left hand extends index and middle fingers horizontally. The dominant right hand extends index and middle fingers horizontally across them, forming the crossbars of ''H''.', 'Extend left index and middle fingers horizontally pointing right.
Extend right index and middle fingers horizontally.
Lay or brush the right fingers across the left fingers at right angles to form the ''H'' ladder pattern.', 'assets/images/isl_h.svg', 1, 'Two-Handed (Interlocking Dual Fingers)', '/eɪtʃ/ (aych)', 'Left hand horizontal dual fingers; right hand brushes across to form the ''H'' grid.', 'Neutral, relaxed facial expression.'),
('i', 'Letter I', 'Alphabets', 'I', 'In authentic Indian Sign Language, Letter I requires both hands. The non-dominant left hand is held flat palm-up, while the dominant right hand extends its pinky finger vertically, resting the base of the hand on the left palm.', 'Hold your left hand flat, palm facing upward at chest height.
Form a fist with your right hand, extending only the little finger (pinky) straight up.
Rest the base of your right palm securely onto your left palm.', 'assets/images/isl_i.svg', 1, 'Two-Handed (Upright Pinky on Flat Palm)', '/aɪ/ (eye)', 'Dominant pinky upright resting on left flat palm. (Distinct from ASL single pinky).', 'Clear eye contact.'),
('j', 'Letter J', 'Alphabets', 'J', 'Starting from the ''I'' configuration, the dominant pinky finger traces a hook-shaped ''J'' curve in the air, landing firmly onto the flat non-dominant left palm.', 'Hold left hand flat, palm facing upward.
Extend right pinky finger and trace a smooth downward-and-upward ''J'' hook in the air.
Conclude the motion by tapping the right pinky tip onto the left palm.', 'assets/images/isl_j.svg', 1, 'Two-Handed (Pinky Hook Trace onto Palm)', '/dʒeɪ/ (jay)', 'Right pinky draws ''J'' curve in air, landing on open left palm.', 'Eyes follow the movement path briefly.'),
('k', 'Letter K', 'Alphabets', 'K', 'The non-dominant left index finger points straight upward. The dominant right hand forms an open ''V'' shape (index and middle fingers) and places the crook or tips against the left index to form the diagonals of ''K''.', 'Hold left index finger vertically upright (the vertical bar).
Spread right index and middle fingers into an open ''V'' shape.
Place the apex/base of the ''V'' against the midpoint of the left index finger.', 'assets/images/isl_k.svg', 1, 'Two-Handed (Index Stem + V Apex Contact)', '/keɪ/ (kay)', 'Left index vertical; right hand forms ''V'' touching midpoint of left index.', 'Neutral head posture.'),
('l', 'Letter L', 'Alphabets', 'L', 'Dominant right hand extends thumb horizontally and index finger vertically at a crisp 90-degree angle. Held steady facing forward at shoulder height.', 'Extend right thumb horizontally outward.
Extend right index finger vertically straight up at a 90-degree angle to the thumb.
Curl remaining three fingers into the palm and present clearly to the viewer.', 'assets/images/isl_l.svg', 0, 'One-Handed Standard (Two-Handed Palm Support Recognized)', '/ɛl/ (el)', 'Single dominant hand forms 90-degree ''L'' upright. Can also be supported by left flat palm.', 'Neutral head alignment.'),
('m', 'Letter M', 'Alphabets', 'M', 'The non-dominant left hand is held flat with palm facing upward. The dominant right hand places three extended fingers (index, middle, ring) pointing down onto the left palm.', 'Hold left hand flat with palm facing upward at mid-chest level.
Extend right index, middle, and ring fingers pointing downward.
Touch the three fingertips firmly onto the center of the left palm.', 'assets/images/isl_m.svg', 1, 'Two-Handed (Three Fingers on Flat Palm)', '/ɛm/ (em)', 'Three fingers of right hand placed onto left palm (representing the 3 downward strokes of ''M'').', 'Neutral expression.'),
('n', 'Letter N', 'Alphabets', 'N', 'The non-dominant left hand is held flat palm-up. The dominant right hand places two extended fingers (index and middle) pointing downward onto the left palm.', 'Hold left hand flat with palm facing upward at mid-chest level.
Extend right index and middle fingers together pointing downward.
Touch the two fingertips firmly onto the center of the left palm.', 'assets/images/isl_n.svg', 1, 'Two-Handed (Two Fingers on Flat Palm)', '/ɛn/ (en)', 'Two fingers of right hand placed onto left palm (representing the 2 downward strokes of ''N'').', 'Neutral expression.'),
('o', 'Letter O', 'Alphabets', 'O', 'In standard formal ISL, the index fingers and thumbs of both hands curve toward each other and meet at the fingertips, forming a full circular ''O'' shape in front of the chest.', 'Curve your left thumb and index finger into a semicircle arc.
Curve your right thumb and index finger into an opposite semicircle arc.
Bring fingertips and thumb tips together to form a clean circular ring.', 'assets/images/isl_o.svg', 1, 'Two-Handed Standard (One-Handed Variation Widely Used)', '/oʊ/ (oh)', 'Primary: Thumbs and index fingers of both hands meet to form a complete circle ''O''. Informal Variation: Single hand curved into ''O''.', 'Neutral posture.'),
('p', 'Letter P', 'Alphabets', 'P', 'The non-dominant left index finger is held straight vertically upright. The dominant right thumb and index finger form a circular loop touching the top half of the left index to construct ''P''.', 'Hold left index finger vertically upright (the stem of P).
Form a small circular loop with right thumb and index finger.
Touch the right loop against the upper half of the left index finger.', 'assets/images/isl_p.svg', 1, 'Two-Handed (Index Stem + Top Loop)', '/piː/ (pee)', 'Left index vertical; right thumb and index form loop touching top half of left index.', 'Neutral facial posture.'),
('q', 'Letter Q', 'Alphabets', 'Q', 'Both hands form a circle, and the dominant right index finger extends downward through the bottom to represent the descender tail of the letter ''Q''.', 'Form a circular ''O'' ring with both hands touching thumbs and index fingers.
Extend the right index finger downward through the bottom of the loop.
Display clearly at chest height.', 'assets/images/isl_q.svg', 1, 'Two-Handed (Circle + Downward Tail)', '/kjuː/ (kyoo)', 'Both hands form circle; right index points down through bottom as tail of ''Q''.', 'Neutral head posture.'),
('r', 'Letter R', 'Alphabets', 'R', 'The dominant right hand crosses the middle finger over the index finger (the classic ''crossed fingers'' shape) and rests the base upright on the flat non-dominant left palm.', 'Hold left hand flat with palm facing upward.
Cross your right middle finger tightly over your right index finger.
Rest the base of the crossed fingers securely on the center of the left palm.', 'assets/images/isl_r.svg', 1, 'Two-Handed (Crossed Fingers on Flat Palm)', '/ɑːr/ (ar)', 'Right middle finger crossed over index finger, resting upright on left flat palm.', 'Neutral face, steady hands.'),
('s', 'Letter S', 'Alphabets', 'S', 'Both hands are clenched into fists in front of the chest, interlocking little fingers (pinkies) or hooking thumb knuckles to form the central curved lock of ''S''.', 'Form fists with both hands at mid-chest level.
Extend little fingers slightly and hook them firmly together.
Pull slightly outward to create tension, signaling the locked ''S''.', 'assets/images/isl_s.svg', 1, 'Two-Handed (Hooked Pinkies / Clenched Fists)', '/ɛs/ (es)', 'Both hands in fists, interlocking pinky fingers or thumb knuckles at center chest.', 'Neutral head alignment.'),
('t', 'Letter T', 'Alphabets', 'T', 'The non-dominant left index finger is held straight vertically upright. The dominant right index finger is placed horizontally across the top fingertip, visually completing the letter ''T''.', 'Hold your left index finger vertically upright at chest height.
Hold your right index finger horizontally.
Place the right index finger right on top of the left fingertip, forming a crisp ''T'' shape.', 'assets/images/isl_t.svg', 1, 'Two-Handed (Index Stem + Horizontal Crossbar)', '/tiː/ (tee)', 'Left index vertical; right index placed horizontally on top tip.', 'Neutral expression.'),
('u', 'Letter U', 'Alphabets', 'U', 'Non-dominant left hand is held flat palm-up. Dominant right index and middle fingers are held tightly together pointing straight up, resting their base on the left palm (representing the ''U'' cup).', 'Hold left hand flat with palm facing upward.
Hold right index and middle fingers together pointing straight up.
Rest the base of the fingers on the flat left palm.', 'assets/images/isl_u.svg', 1, 'Two-Handed (Dual Upright Fingers on Flat Palm)', '/juː/ (yoo)', 'Right index and middle held together upright on left flat palm.', 'Neutral expression.'),
('v', 'Letter V', 'Alphabets', 'V', 'Non-dominant left hand is held flat palm-up. Dominant right index and middle fingers are spread wide in an open ''V'' shape (peace sign), resting their base on the left palm.', 'Hold left hand flat with palm facing upward.
Spread right index and middle fingers into a wide ''V'' shape.
Rest the base of the right hand on the flat left palm.', 'assets/images/isl_v.svg', 1, 'Two-Handed (Spread ''V'' on Flat Palm)', '/viː/ (vee)', 'Right hand forms ''V'' (peace sign) resting on left flat palm. (Single-handed V also recognized).', 'Neutral posture.'),
('w', 'Letter W', 'Alphabets', 'W', 'Dominant right hand spreads index, middle, and ring fingers upward in a ''W'' shape, with the base supported on the flat non-dominant left palm.', 'Hold left hand flat with palm facing upward.
Spread right index, middle, and ring fingers apart forming a ''W''.
Rest the base of the right hand on the flat left palm.', 'assets/images/isl_w.svg', 1, 'Two-Handed (Three Spread Fingers on Flat Palm)', '/ˈdʌbəl.juː/ (double-yoo)', 'Right index, middle, ring spread in ''W'', rested on left flat hand.', 'Neutral head posture.'),
('x', 'Letter X', 'Alphabets', 'X', 'Both hands extend their index fingers straight while curling the other fingers. The two index fingers cross each other at their midpoints at chest level, visibly forming ''X''.', 'Extend both index fingers forward, curling other fingers into fists.
Cross the left and right index fingers at their midpoints in front of your chest.
Hold steady facing forward.', 'assets/images/isl_x.svg', 1, 'Two-Handed (Crossed Index Fingers)', '/ɛks/ (eks)', 'Both index fingers extended and crossed at their midpoints in an ''X''.', 'Neutral expression.'),
('y', 'Letter Y', 'Alphabets', 'Y', 'The dominant right hand extends thumb and pinky outward (the ''shaka'' handshape), while resting the palm securely inside the flat open non-dominant left hand.', 'Hold left hand open, palm facing inward/upward.
Extend right thumb and pinky outward while folding center three fingers.
Rest your right hand inside your left open palm.', 'assets/images/isl_y.svg', 1, 'Two-Handed (Shaka Shape Rested on Palm)', '/waɪ/ (wye)', 'Right hand thumb and pinky extended, rested inside left open palm.', 'Neutral posture.'),
('z', 'Letter Z', 'Alphabets', 'Z', 'The non-dominant left hand is held flat palm-up. The dominant right index finger traces the three distinct strokes of ''Z'' (horizontal right, diagonal down-left, horizontal right) across the left palm.', 'Hold left hand flat with palm facing upward.
Extend right index finger.
Trace a horizontal stroke to the right, diagonal stroke down-left, and horizontal stroke to the right across the left palm.', 'assets/images/isl_z.svg', 1, 'Two-Handed (Z Stroke on Left Palm)', '/zɛd/ (zed) or /ziː/ (zee)', 'Right index traces ''Z'' across flat left palm (or in air).', 'Eyes follow the traced path.'),
('0', 'Number 0', 'Numbers', '0', 'All four fingers curve downward while the thumb curves upward to touch the fingertips, forming a clear oval ''0'' shape facing forward.', 'Bring all four fingertips of your dominant hand to meet the tip of your thumb.
Keep the fingers rounded to form an oval aperture.
Hold steadily facing forward at shoulder level.', 'assets/images/isl_0.svg', 0, 'One-Handed', '/ˈzɪəroʊ/ (zero)', 'All fingers curved to meet thumb forming an oval ''0''.', 'Neutral face.'),
('1', 'Number 1', 'Numbers', '1', 'Dominant index finger extends straight vertically upward while the thumb holds down the other curled fingers.', 'Extend your dominant index finger pointing straight up.
Curl middle, ring, and little fingers into a fist.
Lock the folded fingers securely with your thumb and display palm forward.', 'assets/images/isl_1.svg', 0, 'One-Handed', '/wʌn/ (one)', 'Single index finger upright, palm facing forward.', 'Neutral head alignment.'),
('2', 'Number 2', 'Numbers', '2', 'Index and middle fingers are extended straight upward in a ''V'' shape, with palm facing forward at shoulder height.', 'Extend your index and middle fingers straight up, slightly spread.
Curl ring and little fingers into palm, locked by thumb.
Hold palm facing forward.', 'assets/images/isl_2.svg', 0, 'One-Handed', '/tuː/ (two)', 'Index and middle fingers extended upright in a V shape.', 'Neutral face.'),
('3', 'Number 3', 'Numbers', '3', 'Thumb, index, and middle fingers are extended outward, while the ring and pinky fingers remain folded into the palm.', 'Extend your thumb, index finger, and middle finger outward.
Keep ring finger and pinky curled into the palm.
Hold steadily facing forward.', 'assets/images/isl_3.svg', 0, 'One-Handed', '/θriː/ (three)', 'Thumb, index, and middle fingers extended (or three fingers index, middle, ring).', 'Neutral face.'),
('4', 'Number 4', 'Numbers', '4', 'All four fingers (index, middle, ring, little) are extended vertically straight up, while the thumb is folded tightly across the center of the palm.', 'Extend index, middle, ring, and little fingers straight up.
Fold your thumb tightly across your palm.
Hold palm facing forward at shoulder level.', 'assets/images/isl_4.svg', 0, 'One-Handed', '/fɔːr/ (four)', 'Four fingers upright, thumb folded across palm.', 'Neutral face.'),
('5', 'Number 5', 'Numbers', '5', 'An open hand with all five fingers and thumb spread naturally apart, facing directly forward at shoulder level.', 'Open your dominant hand completely.
Spread all five fingers and thumb naturally apart.
Display palm facing forward at shoulder height.', 'assets/images/isl_5.svg', 0, 'One-Handed', '/faɪv/ (five)', 'Open hand with all five fingers spread wide.', 'Neutral head posture.'),
('6', 'Number 6', 'Numbers', '6', 'In official Indian Sign Language, numerals 6-9 follow an additive base-5 two-handed system. The left hand shows 5 open fingers, while the right index finger touches the left palm (5 + 1 = 6).', 'Hold left hand open with all 5 fingers spread facing the viewer.
Extend right index finger (representing 1).
Touch the right index fingertip against the left open palm to represent 6 (5 + 1).', 'assets/images/isl_6.svg', 1, 'Two-Handed Standard (Additive 5+1)', '/sɪks/ (six)', 'Official ISL: Non-dominant hand displays 5, dominant index taps palm (5 + 1 = 6). Informal variation: Thumb touches little finger.', 'Neutral expression.'),
('7', 'Number 7', 'Numbers', '7', 'Left hand shows 5 open fingers. The dominant right hand touches with two fingers (index and middle) onto the left palm (5 + 2 = 7 in ISL).', 'Hold left hand open with all 5 fingers spread.
Extend right index and middle fingers together.
Touch both right fingertips onto the left open palm to represent 7.', 'assets/images/isl_7.svg', 1, 'Two-Handed Standard (Additive 5+2)', '/ˈsɛvən/ (seven)', 'Official ISL: Left hand displays 5, right hand touches with 2 fingers (5 + 2 = 7).', 'Neutral expression.'),
('8', 'Number 8', 'Numbers', '8', 'Left hand shows 5 open fingers. The dominant right hand touches with three fingers (index, middle, ring) onto the left palm (5 + 3 = 8 in ISL).', 'Hold left hand open with 5 fingers spread.
Extend right index, middle, and ring fingers.
Touch the three right fingertips onto the left open palm to represent 8.', 'assets/images/isl_8.svg', 1, 'Two-Handed Standard (Additive 5+3)', '/eɪt/ (eight)', 'Official ISL: Left hand displays 5, right hand touches with 3 fingers (5 + 3 = 8).', 'Neutral expression.'),
('9', 'Number 9', 'Numbers', '9', 'Left hand shows 5 open fingers. The dominant right hand touches with all four fingers onto the left palm (5 + 4 = 9 in ISL).', 'Hold left hand open with 5 fingers spread.
Extend four fingers of the right hand (thumb folded).
Touch the four right fingertips onto the left open palm to represent 9.', 'assets/images/isl_9.svg', 1, 'Two-Handed Standard (Additive 5+4)', '/naɪn/ (nine)', 'Official ISL: Left hand displays 5, right hand touches with 4 fingers (5 + 4 = 9).', 'Neutral expression.'),
('hello', 'Hello / Namaste', 'Greetings', 'Hello / Namaste', 'The primary and most respectful greeting in Indian Sign Language. Both flat palms are pressed together in front of the center chest in the traditional Namaste gesture, accompanied by a polite head nod and warm smile.', 'Bring both flat palms together with fingers pointing upward in front of your chest.
Hold hands at mid-chest level, thumbs lightly touching the sternum.
Bow your head slightly with a polite, welcoming facial expression.', 'assets/images/isl_hello.svg', 1, 'Two-Handed Standard (One-Hand Wave Recognized)', '/nəˈmʌsteɪ/ or /ˈhɛloʊ/', 'Primary: Both palms joined in respectful Namaste posture at chest. Informal: Right open hand raised near temple with gentle wave.', 'Warm smile and polite slight head tilt.'),
('good_morning', 'Good Morning', 'Greetings', 'Good Morning', 'A compound ISL sign combining ''Good'' (thumbs-up pushing gently forward) with ''Morning'' (right hand rising upward from underneath the horizontal left forearm like the morning sun).', 'Give a clean thumbs-up with your dominant hand moving forward from the chest for ''Good''.
Extend your left arm horizontally in front of you representing the horizon.
Rise your right open hand upward from below the left arm to simulate the rising sun for ''Morning''.', 'assets/images/isl_good_morning.svg', 1, 'Two-Handed Compound Sign', '/ɡʊd ˈmɔːrnɪŋ/', 'Compound sign: Sign for ''Good'' (thumbs-up forward) followed by ''Morning'' (sun rising over horizon).', 'Bright, awake, cheerful facial expression.'),
('thank_you', 'Thank You', 'Common Words', 'Thank You', 'The flat dominant right hand gently touches the chin or lips with the fingertips, then smoothly sweeps forward and downward toward the conversation partner with an appreciative nod.', 'Place fingertips of your open flat right hand against your chin or lower lip.
Move your hand smoothly outward and downward toward the other person.
Nod your head gently with an appreciative smile.', 'assets/images/isl_thank_you.svg', 0, 'One-Handed', '/ˈθæŋk juː/', 'Flat right hand touches chin/lips and sweeps forward towards receiver with head nod.', 'Appreciative smile and slight forward nod.'),
('sorry', 'Sorry', 'Common Words', 'Sorry', 'A closed dominant fist with thumb folded over fingers is rubbed gently in a circular clockwise motion over the left side of the chest (the heart) with an apologetic facial expression.', 'Form a firm fist with your dominant right hand.
Place the fist against the left side of your chest over your heart.
Move the fist in a gentle circular clockwise motion 2-3 times while maintaining an apologetic expression.', 'assets/images/isl_sorry.svg', 0, 'One-Handed', '/ˈsɒri/ (sor-ree)', 'Closed right fist rubbed in a clockwise circular motion over the heart/chest.', 'Apologetic facial expression, slightly lowered eyebrows.'),
('please', 'Please', 'Common Words', 'Please', 'The open flat right hand with fingers together rubs smoothly in a gentle circular clockwise motion over the center of the chest, expressing politeness and request.', 'Place your open flat right hand against the center of your chest.
Keep fingers close together and palm flat.
Move the hand in a smooth circular motion with a friendly, pleading expression.', 'assets/images/isl_please.svg', 0, 'One-Handed', '/pliːz/', 'Flat open palm rubs smoothly in a circular motion on the center chest.', 'Gentle, polite facial expression, slight head nod.'),
('help', 'Help', 'Common Words', 'Help', 'Non-dominant left hand is extended flat with palm facing upward. The dominant right hand forms a thumbs-up fist placed squarely on the left palm, and both hands are lifted upward together.', 'Hold left hand flat with palm facing upward at lower chest height.
Make a ''thumbs-up'' fist with your right hand and place it firmly onto the left palm.
Lift both hands upward together 4-6 inches in a supportive upward motion.', 'assets/images/isl_help.svg', 1, 'Two-Handed (Supporting Base + Lifted Fist)', '/hɛlp/', 'Left flat palm up; right thumbs-up fist placed onto left palm and lifted upward together.', 'Attentive, earnest facial expression.'),
('yes', 'Yes', 'Common Words', 'Yes', 'A closed dominant fist is held forward at chest/shoulder level and nods up and down from the wrist, mirroring the biological motion of nodding one''s head in agreement.', 'Make a fist with your dominant right hand held at chest level, knuckles forward.
Bend your wrist forward and backward twice in a nodding motion.
Nod your head simultaneously in affirmation.', 'assets/images/isl_yes.svg', 0, 'One-Handed', '/jɛs/', 'Closed fist nodding up and down from the wrist like a head nod.', 'Simultaneous head nodding in agreement.'),
('no', 'No', 'Common Words', 'No', 'The dominant index and middle fingers are extended horizontally with the thumb beneath them, then snap quickly downward to meet the thumb tip, signaling a firm negative.', 'Extend right thumb, index, and middle fingers outward.
Snap the index and middle fingertips quickly down onto the thumb tip.
Shake your head side-to-side simultaneously in negation.', 'assets/images/isl_no.svg', 0, 'One-Handed', '/noʊ/', 'Index and middle fingers snap down onto thumb, or index finger wags side-to-side.', 'Head shaking slightly side-to-side.'),
('water', 'Water', 'Common Words', 'Water', 'The dominant hand forms a ''W'' handshape (index, middle, and ring fingers spread apart) and taps the index fingertip gently against the side of the chin or lips twice.', 'Form a ''W'' handshape with your right hand (index, middle, ring spread).
Bring the hand to the right side of your chin/lower lip.
Tap the index fingertip gently against the chin twice.', 'assets/images/isl_water.svg', 0, 'One-Handed', '/ˈwɔːtər/', '''W'' handshape taps chin/lips twice, or cupped hand drinking motion.', 'Neutral, relaxed face.'),
('food', 'Food / Eat', 'Common Words', 'Food / Eat', 'All five fingertips of the dominant right hand are bunched together (touching the thumb tip in a pinched handshape) and moved toward the mouth twice, simulating taking food.', 'Bring all four fingertips of your right hand together to touch your thumb tip.
Position the bunched hand in front of your mouth.
Move the hand toward your mouth twice in small repeated motions.', 'assets/images/isl_food.svg', 0, 'One-Handed', '/fuːd/ or /iːt/', 'Bunched fingertips move toward open mouth twice.', 'Slight mouth opening or natural eating expression.'),
('what_is_your_name', 'What is your name?', 'Greetings', 'What is your name?', 'A standard ISL introduction sequence. You point the index finger forward at the other person (''You''), touch index and middle fingers to the chest/forehead (''Name''), then hold both hands palms-up wiggling fingers with an inquisitive expression (''What?'').', 'Point your right index finger forward at the conversation partner (''You'').
Touch your right index and middle fingers to your forehead or upper chest (''Name'').
Open both hands palms up at waist level and wiggle fingers gently while tilting your head in question (''What?'').', 'assets/images/isl_what_is_your_name.svg', 1, 'Two-Handed Question Sequence', '/wʌt ɪz jʊər neɪm/', 'Point forward (''You'') + touch index/middle to chest (''Name'') + wiggle palms up (''What?'').', 'Questioning expression with furrowed brow and tilted head.'),
('how_are_you', 'How are you?', 'Greetings', 'How are you?', 'Both curved hands are placed with palms facing the chest and thumbs pointing up. The hands roll smoothly outward and forward until palms face upward, accompanied by an inquisitive facial expression.', 'Place both cupped hands in front of your chest with knuckles facing forward, thumbs pointing up.
Roll both hands smoothly outward and forward away from your body.
End with both palms open facing upward, tilting your head inquisitively.', 'assets/images/isl_how_are_you.svg', 1, 'Two-Handed Inquiry', '/haʊ ɑːr juː/', 'Both hands curved palms facing chest, rolling forward and opening outward with questioning expression.', 'Questioning expression with raised eyebrows and slight head tilt.');

-- 3. Seed Quizzes (10 Comprehensive Questions)
INSERT INTO quizzes (id, question, category, sign_id, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(1, 'Identify the Indian Sign Language (ISL) letter shown in the image:', 'Alphabets', 'a', 'Letter A', 'Letter S', 'Letter T', 'Letter M', 'A', 'In ISL, Letter A is signed with both fists closed and thumbs touching together at chest height.'),
(2, 'What message or greeting does this sign represent in ISL?', 'Common Signs', 'hello', 'Good Bye', 'Hello / Namaste', 'Thank You', 'Excuse Me', 'B', 'Both palms joined together in front of the chest in a Namaste posture represents Hello or Namaste in Indian Sign Language.'),
(3, 'Identify the polite expression demonstrated in this gesture:', 'Common Signs', 'thank_you', 'Please', 'Sorry', 'Thank You', 'Welcome', 'C', 'Touching the chin or lips with a flat hand and moving it gently forward towards the person signs Thank You.'),
(4, 'Which numerical digit is represented by this sign?', 'Numbers', '5', 'Number 3', 'Number 4', 'Number 5', 'Number 10', 'C', 'An open hand with all five fingers and thumb spread outward clearly represents Number 5.'),
(5, 'Which crucial emergency or everyday word is signed here?', 'Common Signs', 'help', 'Stop', 'Help', 'Wait', 'Doctor', 'B', 'Left hand flat palm up, with right thumbs-up fist placed onto it and lifted upward together signifies Help.'),
(6, 'Identify the ISL alphabet letter demonstrated:', 'Alphabets', 'c', 'Letter O', 'Letter C', 'Letter G', 'Letter U', 'B', 'Curving the fingers and thumb to form a curved open arc represents the Letter C in ISL.'),
(7, 'Which sign is formed by a closed fist rubbing circular over the heart?', 'Common Signs', 'sorry', 'Pain', 'Angry', 'Sorry', 'Love', 'C', 'In ISL, rubbing a closed fist in a soothing circular motion over the heart represents Sorry / Apology.'),
(8, 'Identify this single-finger sign:', 'Numbers', '1', 'Number 1', 'Letter I', 'Look Up', 'Silence', 'A', 'A single upright index finger with other fingers folded represents Number 1.'),
(9, 'Which daily essential is signed by tapping a W-shape at the chin?', 'Everyday', 'water', 'Tea', 'Food', 'Water', 'Medicine', 'C', 'Forming a W-handshape and tapping the fingertips against the chin/lips twice is the standard ISL sign for Water.'),
(10, 'Which affirmative response is communicated by this nodding fist?', 'Common Signs', 'yes', 'No', 'Yes', 'Maybe', 'Sure', 'B', 'A closed fist held forward that nods up and down from the wrist mimics a nodding head for Yes.');

-- 4. Seed User Progress (18 lessons completed by user 1)
INSERT INTO user_progress (user_id, lesson_id, completion_status) VALUES
(1, 'a', 'completed'),
(1, 'b', 'completed'),
(1, 'c', 'completed'),
(1, 'd', 'completed'),
(1, 'e', 'completed'),
(1, 'f', 'completed'),
(1, 'g', 'completed'),
(1, 'h', 'completed'),
(1, 'i', 'completed'),
(1, 'j', 'completed'),
(1, '0', 'completed'),
(1, '1', 'completed'),
(1, '2', 'completed'),
(1, '3', 'completed'),
(1, 'hello', 'completed'),
(1, 'thank_you', 'completed'),
(1, 'please', 'completed'),
(1, 'help', 'completed');

-- 5. Seed Quiz Results
INSERT INTO quiz_results (user_id, score, total_questions, percentage, category) VALUES
(1, 9, 10, 90.00, 'ISL Mixed Quiz'),
(1, 8, 10, 80.00, 'ISL Mixed Quiz'),
(1, 10, 10, 100.00, 'Alphabets Quiz');

-- 6. Seed Sample Communication Logs
INSERT INTO communication_logs (user_id, recognized_sign, confidence) VALUES
(1, 'HELLO', 0.96),
(1, 'THANK YOU', 0.94),
(1, 'HOW ARE YOU', 0.91);
