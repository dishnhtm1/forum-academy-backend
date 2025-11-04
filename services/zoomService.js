const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class ZoomService {
  constructor() {
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    // Keep backward compatibility
    this.apiKey = process.env.ZOOM_API_KEY || this.clientId;
    this.apiSecret = process.env.ZOOM_API_SECRET || this.clientSecret;
    this.baseURL = 'https://api.zoom.us/v2';
    this.accessToken = null;
    this.tokenExpiry = null;
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('⚠️  Zoom API credentials not found. Please set ZOOM_API_KEY and ZOOM_API_SECRET (or ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET) environment variables.');
    } else {
      console.log('✅ Zoom credentials configured');
    }
  }

  // Get OAuth Access Token for Server-to-Server OAuth
  async getAccessToken() {
    try {
      // Return cached token if still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      console.log('🔑 Fetching new Zoom access token...');
      
      // Use Server-to-Server OAuth if accountId is available
      if (this.accountId) {
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        
        const response = await axios.post(
          `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`,
          {},
          {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        this.accessToken = response.data.access_token;
        // Set expiry to 5 minutes before actual expiry for safety
        this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
        
        console.log('✅ Zoom access token obtained');
        return this.accessToken;
      } else {
        // Fallback to JWT for legacy apps
        return this.generateJWT();
      }
    } catch (error) {
      console.error('❌ Error getting Zoom access token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Generate JWT token for Zoom API authentication (legacy method)
  generateJWT() {
    const payload = {
      iss: this.apiKey,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
    };

    return jwt.sign(payload, this.apiSecret);
  }

  // Create a Zoom meeting
  async createMeeting(meetingData) {
    try {
      const token = await this.getAccessToken();
      
      const meetingConfig = {
        topic: meetingData.title,
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime,
        duration: meetingData.duration,
        timezone: 'UTC',
        agenda: meetingData.description || '',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: meetingData.settings?.muteOnEntry || true,
          waiting_room: meetingData.settings?.waitingRoom || true,
          auto_recording: meetingData.settings?.autoRecording || 'none',
          enforce_login: false,
          enforce_login_domains: '',
          alternative_hosts: '',
          close_registration: false,
          show_share_button: true,
          allow_multiple_devices: true,
          registrants_confirmation_email: false,
          waiting_room_settings: {
            participants_to_place_in_waiting_room: 0,
            who_can_admit_participants_from_waiting_room: 1
          }
        }
      };

      const response = await axios.post(
        `${this.baseURL}/users/me/meetings`,
        meetingConfig,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        meeting: {
          id: response.data.id,
          joinUrl: response.data.join_url,
          startUrl: response.data.start_url,
          password: response.data.password,
          meetingId: response.data.id,
          ...response.data
        }
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Update a Zoom meeting
  async updateMeeting(meetingId, updateData) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.patch(
        `${this.baseURL}/meetings/${meetingId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        meeting: response.data
      };
    } catch (error) {
      console.error('Error updating Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Delete a Zoom meeting
  async deleteMeeting(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      await axios.delete(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get meeting details
  async getMeeting(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        meeting: response.data
      };
    } catch (error) {
      console.error('Error getting Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get meeting participants (requires meeting to be ended)
  async getMeetingParticipants(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        participants: response.data.participants || []
      };
    } catch (error) {
      console.error('Error getting meeting participants:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get meeting recordings
  async getMeetingRecordings(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        recordings: response.data.recording_files || []
      };
    } catch (error) {
      console.error('Error getting meeting recordings:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Generate meeting signature for SDK authentication
  generateSDKSignature(meetingNumber, role = 0) {
    const timestamp = new Date().getTime() - 30000;
    const msg = Buffer.from(this.apiKey + meetingNumber + timestamp + role).toString('base64');
    const hash = crypto.createHmac('sha256', this.apiSecret).update(msg).digest('base64');
    const signature = Buffer.from(`${this.apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
    
    return {
      signature,
      meetingNumber,
      apiKey: this.apiKey,
      timestamp,
      role
    };
  }
}

module.exports = new ZoomService();
