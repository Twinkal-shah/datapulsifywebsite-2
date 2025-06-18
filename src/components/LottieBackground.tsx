
import React from 'react';
import Lottie from 'lottie-react';

interface LottieBackgroundProps {
  className?: string;
  animationData?: any;
  loop?: boolean;
  autoplay?: boolean;
}

const LottieBackground: React.FC<LottieBackgroundProps> = ({
  className = '',
  animationData,
  loop = true,
  autoplay = true
}) => {
  // Using a growth/chart animation JSON (you can replace this with your own)
  const defaultGrowthAnimation = {
    "v": "5.7.4",
    "fr": 30,
    "ip": 0,
    "op": 90,
    "w": 1920,
    "h": 1080,
    "nm": "Growth Chart",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Chart Line",
        "sr": 1,
        "ks": {
          "o": {"a": 0, "k": 30},
          "r": {"a": 0, "k": 0},
          "p": {"a": 0, "k": [960, 540, 0]},
          "a": {"a": 0, "k": [0, 0, 0]},
          "s": {"a": 1, "k": [
            {"i": {"x": [0.667], "y": [1]}, "o": {"x": [0.333], "y": [0]}, "t": 0, "s": [0]},
            {"t": 89, "s": [100]}
          ]}
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ind": 0,
                "ty": "sh",
                "ks": {
                  "a": 1,
                  "k": [
                    {"i": {"x": 0.667, "y": 1}, "o": {"x": 0.333, "y": 0}, "t": 0, "s": [{"i": [[0,0],[0,0],[0,0]], "o": [[0,0],[0,0],[0,0]], "v": [[-400,-200],[-200,100],[400,-150]], "c": false}]},
                    {"t": 89, "s": [{"i": [[0,0],[0,0],[0,0]], "o": [[0,0],[0,0],[0,0]], "v": [[-400,-200],[-200,100],[400,-150]], "c": false}]}
                  ]
                }
              },
              {
                "ty": "st",
                "c": {"a": 0, "k": [0.2, 0.6, 1, 1]},
                "o": {"a": 0, "k": 100},
                "w": {"a": 0, "k": 8},
                "lc": 2,
                "lj": 2
              }
            ]
          }
        ],
        "ip": 0,
        "op": 90,
        "st": 0,
        "bm": 0
      }
    ]
  };

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <Lottie
        animationData={animationData || defaultGrowthAnimation}
        loop={loop}
        autoplay={autoplay}
        style={{
          width: '100%',
          height: '100%',
          opacity: 0.1,
          filter: 'blur(1px)'
        }}
      />
    </div>
  );
};

export default LottieBackground;