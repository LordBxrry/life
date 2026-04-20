/**
 * FACIAL RECOGNITION FRONTEND UTILITY
 * 
 * Uses face-api.js (built on TensorFlow.js) to:
 * - Detect faces in video stream
 * - Extract facial descriptors
 * - Verify faces match during login
 */

class FacialRecognition {
  constructor() {
    this.isInitialized = false;
    this.currentDescriptor = null;
    this.detectionOptions = null;
  }

  /**
   * Initialize facial recognition models
   * Must be called before using facial recognition
   */
  async initialize() {
    try {
      // Load face-api.js models from CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/';
      
      // Load required models
      await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceDetectionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);

      // Set detection options (for better accuracy)
      this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      });

      this.isInitialized = true;
      console.log('✓ Facial recognition models loaded');
      return true;
    } catch (err) {
      console.error('Failed to initialize facial recognition:', err);
      return false;
    }
  }

  /**
   * Start video stream from webcam
   * @param {string} videoElementId - ID of video element to display stream
   * @returns {Promise<boolean>} Success status
   */
  async startVideoStream(videoElementId) {
    try {
      const videoElement = document.getElementById(videoElementId);
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      videoElement.srcObject = stream;
      
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve(true);
        };
      });
    } catch (err) {
      console.error('Failed to start video stream:', err);
      alert('Camera access required for facial recognition');
      return false;
    }
  }

  /**
   * Stop video stream and release camera
   * @param {string} videoElementId - ID of video element
   */
  stopVideoStream(videoElementId) {
    try {
      const videoElement = document.getElementById(videoElementId);
      if (videoElement && videoElement.srcObject) {
        // Stop all tracks
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    } catch (err) {
      console.error('Error stopping video stream:', err);
    }
  }

  /**
   * Detect face in video and extract descriptor
   * @param {string} videoElementId - ID of video element
   * @returns {Promise<object>} Face detection result with descriptor
   */
  async detectFaceInVideo(videoElementId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Facial recognition not initialized');
      }

      const videoElement = document.getElementById(videoElementId);
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      // Detect faces with landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(videoElement, this.detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();

      if (detections.length === 0) {
        return {
          success: false,
          error: 'No face detected. Please position your face in the camera.'
        };
      }

      if (detections.length > 1) {
        return {
          success: false,
          error: `Multiple faces detected (${detections.length}). Please ensure only one person is in frame.`
        };
      }

      // Extract primary face
      const detection = detections[0];
      const descriptor = detection.descriptor;
      
      // Convert Float32Array to regular array for JSON serialization
      const descriptorArray = Array.from(descriptor);

      this.currentDescriptor = descriptorArray;

      return {
        success: true,
        descriptor: descriptorArray,
        detection: {
          box: detection.detection.box,
          score: detection.detection.score.toFixed(4),
          landmarks: detection.landmarks.positions.length,
          expressions: detection.expressions,
          age: Math.round(detection.age),
          gender: detection.gender,
          genderProbability: detection.genderProbability.toFixed(2)
        }
      };
    } catch (err) {
      console.error('Face detection error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Detect face from canvas/image element
   * @param {HTMLImageElement|HTMLCanvasElement} imageElement - Image to analyze
   * @returns {Promise<object>} Face detection result with descriptor
   */
  async detectFaceInImage(imageElement) {
    try {
      if (!this.isInitialized) {
        throw new Error('Facial recognition not initialized');
      }

      // Detect faces with all features
      const detections = await faceapi
        .detectAllFaces(imageElement, this.detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();

      if (detections.length === 0) {
        return {
          success: false,
          error: 'No face detected in image'
        };
      }

      if (detections.length > 1) {
        return {
          success: false,
          error: `Multiple faces detected (${detections.length})`
        };
      }

      const detection = detections[0];
      const descriptor = detection.descriptor;
      const descriptorArray = Array.from(descriptor);

      this.currentDescriptor = descriptorArray;

      return {
        success: true,
        descriptor: descriptorArray,
        detection: {
          box: detection.detection.box,
          score: detection.detection.score.toFixed(4),
          expressions: detection.expressions,
          age: Math.round(detection.age),
          gender: detection.gender
        }
      };
    } catch (err) {
      console.error('Image face detection error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Draw face detection box on canvas
   * @param {HTMLCanvasElement} canvasElement - Canvas to draw on
   * @param {HTMLVideoElement|HTMLImageElement} sourceElement - Source element
   * @param {object} detection - Detection result from detectFaceInVideo
   */
  drawFaceDetection(canvasElement, sourceElement, detection) {
    try {
      const ctx = canvasElement.getContext('2d');
      const displaySize = {
        width: sourceElement.width,
        height: sourceElement.height
      };

      // Set canvas size
      canvasElement.width = displaySize.width;
      canvasElement.height = displaySize.height;

      if (detection && detection.detection) {
        const box = detection.detection.box;
        
        // Draw rectangle
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw label
        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Arial';
        ctx.fillText(
          `Face detected (${detection.detection.score})`,
          box.x,
          Math.max(10, box.y - 10)
        );
      }
    } catch (err) {
      console.error('Error drawing face detection:', err);
    }
  }

  /**
   * Get current stored descriptor
   * @returns {Array|null} Current facial descriptor
   */
  getCurrentDescriptor() {
    return this.currentDescriptor;
  }

  /**
   * Clear current descriptor
   */
  clearDescriptor() {
    this.currentDescriptor = null;
  }

  /**
   * Setup facial recognition (save face for first time)
   * @param {string} videoElementId - ID of video element
   * @param {string} token - Authentication token
   * @returns {Promise<object>} Setup result
   */
  async setupFacialRecognition(videoElementId, token) {
    try {
      // Detect face
      const detection = await this.detectFaceInVideo(videoElementId);
      if (!detection.success) {
        return detection;
      }

      const facialDescriptor = detection.descriptor;

      // Send to backend
      const response = await fetch('/api/facial/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ facialDescriptor })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Facial setup error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Verify facial recognition for login
   * @param {string} email - User email
   * @param {string} videoElementId - ID of video element with camera stream
   * @returns {Promise<object>} Login result with token
   */
  async verifyFacialLogin(email, videoElementId) {
    try {
      // Detect face in video
      const detection = await this.detectFaceInVideo(videoElementId);
      if (!detection.success) {
        return detection;
      }

      const facialDescriptor = detection.descriptor;

      // Send to backend for verification
      const response = await fetch('/api/facial/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          facialDescriptor
        })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Facial login verification error:', err);
      return {
        error: true,
        message: err.message
      };
    }
  }

  /**
   * Check if facial recognition is available for email
   * @param {string} email - User email
   * @returns {Promise<boolean>} Whether facial recognition is enabled
   */
  async isFacialRecognitionAvailable(email) {
    try {
      const response = await fetch('/api/facial/check-enabled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      return result.facial_recognition_available === true;
    } catch (err) {
      console.error('Error checking facial availability:', err);
      return false;
    }
  }

  /**
   * Disable facial recognition
   * @param {string} token - Authentication token
   * @returns {Promise<object>} Disable result
   */
  async disableFacialRecognition(token) {
    try {
      const response = await fetch('/api/facial/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error disabling facial recognition:', err);
      return {
        error: true,
        message: err.message
      };
    }
  }

  /**
   * Get facial recognition status
   * @param {string} token - Authentication token
   * @returns {Promise<object>} Facial recognition status
   */
  async getFacialRecognitionStatus(token) {
    try {
      const response = await fetch('/api/facial/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error getting facial status:', err);
      return {
        error: true,
        message: err.message
      };
    }
  }
}

// Create global instance
let FacialRec = null;

// Function to get/create instance
async function initFacialRecognition() {
  if (!FacialRec) {
    FacialRec = new FacialRecognition();
    const initialized = await FacialRec.initialize();
    if (!initialized) {
      alert('Facial recognition unavailable. Please try again.');
      return null;
    }
  }
  return FacialRec;
}
