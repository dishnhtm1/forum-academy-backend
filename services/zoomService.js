// services/zoomService.js

/**
 * Simulate fetching Zoom meetings (dummy placeholder).
 */
export const getMeetings = async () => {
  console.log("📅 Fetching Zoom meetings (placeholder)...");
  return [
    {
      id: "12345",
      topic: "Sample Meeting",
      start_time: new Date().toISOString(),
      join_url: "https://zoom.us/j/12345",
    },
  ];
};

/**
 * Simulate creating a Zoom meeting (dummy placeholder).
 */
export const createMeeting = async (topic, start_time) => {
  console.log(`🆕 Creating Zoom meeting: ${topic}`);
  return {
    id: "67890",
    topic,
    start_time,
    join_url: "https://zoom.us/j/67890",
  };
};
