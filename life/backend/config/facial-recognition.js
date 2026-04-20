const crypto = require('crypto');

/**
 * Facial Recognition Utility Module
 * 
 * Handles facial descriptor storage, hashing, and verification
 * Uses JSON serialization for facial descriptors
 */

/**
 * Hash facial descriptor for secure storage
 * @param {Array} facialDescriptor - Facial descriptor array
 * @returns {string} SHA256 hash of the descriptor
 */
const hashFacialDescriptor = (facialDescriptor) => {
  if (!facialDescriptor || !Array.isArray(facialDescriptor)) {
    throw new Error('Invalid facial descriptor');
  }
  
  const descriptorString = JSON.stringify(facialDescriptor);
  return crypto
    .createHash('sha256')
    .update(descriptorString)
    .digest('hex');
};

/**
 * Serialize facial descriptor for database storage
 * @param {Array} facialDescriptor - Facial descriptor array
 * @returns {string} JSON string of descriptor
 */
const serializeFacialDescriptor = (facialDescriptor) => {
  if (!facialDescriptor || !Array.isArray(facialDescriptor)) {
    throw new Error('Invalid facial descriptor');
  }
  
  return JSON.stringify(facialDescriptor);
};

/**
 * Deserialize facial descriptor from database storage
 * @param {string} serializedDescriptor - JSON string of descriptor
 * @returns {Array} Facial descriptor array
 */
const deserializeFacialDescriptor = (serializedDescriptor) => {
  if (!serializedDescriptor) {
    throw new Error('No serialized descriptor provided');
  }
  
  try {
    return JSON.parse(serializedDescriptor);
  } catch (err) {
    throw new Error('Invalid serialized facial descriptor');
  }
};

/**
 * Calculate Euclidean distance between two facial descriptors
 * Lower distance = more similar faces
 * Distance ~0.5 or less = likely same person
 * 
 * @param {Array} descriptor1 - First facial descriptor
 * @param {Array} descriptor2 - Second facial descriptor
 * @returns {number} Euclidean distance
 */
const calculateFacialDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || 
      !Array.isArray(descriptor1) || !Array.isArray(descriptor2)) {
    throw new Error('Invalid descriptors for distance calculation');
  }
  
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptor dimensions do not match');
  }
  
  let sumSquareDifferences = 0;
  
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sumSquareDifferences += diff * diff;
  }
  
  return Math.sqrt(sumSquareDifferences);
};

/**
 * Verify if a facial descriptor matches stored descriptor
 * Uses Euclidean distance with configurable threshold
 * 
 * @param {Array} capturedDescriptor - Facial descriptor from camera
 * @param {string} storedSerializedDescriptor - Stored descriptor from database
 * @param {number} threshold - Distance threshold (default 0.5)
 * @returns {object} { match: boolean, distance: number }
 */
const verifyFacialDescriptor = (
  capturedDescriptor,
  storedSerializedDescriptor,
  threshold = 0.5
) => {
  try {
    const storedDescriptor = deserializeFacialDescriptor(storedSerializedDescriptor);
    const distance = calculateFacialDistance(capturedDescriptor, storedDescriptor);
    
    return {
      match: distance <= threshold,
      distance: parseFloat(distance.toFixed(4)),
      threshold: threshold
    };
  } catch (err) {
    return {
      match: false,
      error: err.message,
      distance: null
    };
  }
};

/**
 * Store facial recognition data for user
 * @returns {object} Object with serialized descriptor and hash
 */
const processAndStoreFacialData = (facialDescriptor) => {
  try {
    if (!facialDescriptor || !Array.isArray(facialDescriptor)) {
      throw new Error('Invalid facial descriptor');
    }
    
    const serialized = serializeFacialDescriptor(facialDescriptor);
    const hash = hashFacialDescriptor(facialDescriptor);
    
    return {
      facial_descriptor: serialized,
      facial_data_hash: hash,
      success: true
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Validate that facial recognition setup meets requirements
 * @param {object} data - Object with facial_descriptor and facial_data_hash
 * @returns {boolean} Valid if hash matches descriptor
 */
const validateFacialData = (data) => {
  try {
    if (!data.facial_descriptor || !data.facial_data_hash) {
      return false;
    }
    
    const descriptor = deserializeFacialDescriptor(data.facial_descriptor);
    const expectedHash = hashFacialDescriptor(descriptor);
    
    return expectedHash === data.facial_data_hash;
  } catch (err) {
    return false;
  }
};

/**
 * Get facial recognition status for user
 * @returns {object} Status information
 */
const getFacialRecognitionStatus = (user) => {
  return {
    enabled: user.facial_recognition_enabled === 1 || user.facial_recognition_enabled === true,
    hasData: !!user.facial_descriptor,
    setupDate: user.facial_setup_date,
    lastLogin: user.last_facial_login,
    dataHash: user.facial_data_hash
  };
};

module.exports = {
  hashFacialDescriptor,
  serializeFacialDescriptor,
  deserializeFacialDescriptor,
  calculateFacialDistance,
  verifyFacialDescriptor,
  processAndStoreFacialData,
  validateFacialData,
  getFacialRecognitionStatus
};
