import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button
} from '@windmill/react-ui';
import PageTitle from '@/components/Typography/PageTitle';

/**
 * 📊 Sales Analytics Dashboard - Ultra Simple Version
 * No useCallback, no async - basic React only
 */
const SalesAnalytics = () => {
  const [message, setMessage] = useState('Component loading...');
  const [counter, setCounter] = useState(0);

  // Simple useEffect test
  useEffect(() => {
    console.log('🎸 Component mounted!');
    setMessage('Component mounted successfully!');
  }, []);

  // Simple function test
  const handleClick = () => {
    setCounter(counter + 1);
    setMessage(`Button clicked ${counter + 1} times! 🎸`);
    console.log('🎸 Button clicked:', counter + 1);
  };

  return (
    <div>
      <PageTitle>Sales Analytics - Ultra Simple Test</PageTitle>
      
      <Card className="mb-8">
        <CardBody>
          <h1 className="text-2xl font-semibold mb-4">
            🎸 Ultra Simple Sales Analytics Test
          </h1>
          
          <div className="space-y-4">
            <p className="text-lg">Status: {message}</p>
            
            <p>Counter: {counter}</p>
            
            <Button onClick={handleClick}>
              Test Button (Click me!)
            </Button>
            
            <div className="mt-4 p-4 bg-green-100 rounded">
              <h3 className="font-semibold">✅ Working Features:</h3>
              <ul className="mt-2 space-y-1">
                <li>• React component renders</li>
                <li>• useState works</li>
                <li>• useEffect works</li>
                <li>• Event handlers work</li>
                <li>• WindmillUI components work</li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-blue-100 rounded">
              <h3 className="font-semibold">🎸 Elvis Says:</h3>
              <p className="italic">
                "Thank you, thank you very much! This is the simplest version possible!" 🎤
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SalesAnalytics; 