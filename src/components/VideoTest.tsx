import React from 'react';

const VideoTest = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px' }}>
      <h2>Video Test Component</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Dashboard GIF Test:</h3>
        <img 
          src="/videos/dp-dashboard-video-final.gif"
          alt="Dashboard Test"
          style={{ width: '300px', border: '2px solid red' }}
          onLoad={() => console.log('✅ Dashboard GIF loaded successfully')}
          onError={(e) => {
            console.error('❌ Dashboard GIF failed to load:', e);
            console.log('Trying to load from different path...');
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Google Sheets MP4 Test:</h3>
        <video 
          src="/videos/dp-addon-working.mp4"
          style={{ width: '300px', border: '2px solid blue' }}
          controls
          muted
          onLoadStart={() => console.log('📹 Video loading started')}
          onLoadedData={() => console.log('✅ Video data loaded successfully')}
          onError={(e) => {
            console.error('❌ Video failed to load:', e);
            console.log('Video error details:', e.currentTarget.error);
          }}
        />
      </div>

      <div>
        <h3>File Existence Test:</h3>
        <button onClick={() => {
          fetch('/videos/dp-dashboard-video-final.gif')
            .then(response => {
              console.log('GIF fetch response:', response.status, response.statusText);
              return response.blob();
            })
            .then(blob => {
              console.log('GIF blob size:', blob.size, 'bytes');
            })
            .catch(err => console.error('GIF fetch error:', err));
        }}>
          Test GIF Fetch
        </button>
        
        <button onClick={() => {
          fetch('/videos/dp-addon-working.mp4')
            .then(response => {
              console.log('MP4 fetch response:', response.status, response.statusText);
              return response.blob();
            })
            .then(blob => {
              console.log('MP4 blob size:', blob.size, 'bytes');
            })
            .catch(err => console.error('MP4 fetch error:', err));
        }} style={{ marginLeft: '10px' }}>
          Test MP4 Fetch
        </button>
      </div>
    </div>
  );
};

export default VideoTest; 