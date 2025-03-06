/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});

// Function to update sleep streaks daily at midnight EST
export const updateSleepStreaks = onSchedule(
  {
    // Schedule for midnight EST (5am UTC)
    schedule: '0 5 * * *',
  },
  async (event): Promise<void> => {
    logger.info('Running updateSleepStreaks function', {
      structuredData: true,
    });

    const db = getFirestore();

    try {
      // Calculate yesterday's date (in UTC to match Firebase's timestamps)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(5, 0, 0, 0);

      // Convert to Firestore timestamps
      const yesterdayStart = Timestamp.fromDate(yesterday);
      const yesterdayEnd_ts = Timestamp.fromDate(today);

      logger.info(
        `Querying sleep sessions between ${yesterdayStart.toDate()} and ${yesterdayEnd_ts.toDate()}`,
      );

      // Get all completed sleep sessions from yesterday
      const sleepSessionsRef = db.collection('sleepSessions');
      const sessionsSnapshot = await sleepSessionsRef
        .where('active', '==', false)
        .where('startTime', '>=', yesterdayStart)
        .where('endTime', '<=', yesterdayEnd_ts)
        .get();

      logger.info(`Found ${sessionsSnapshot.size} completed sleep sessions`);

      // Group sessions by user
      const userSessions: {
        [key: string]: { startTime: Date; endTime: Date; penalty: number }[];
      } = {};

      sessionsSnapshot.forEach((doc) => {
        const session = doc.data();
        const userId = session.userID;

        if (!userSessions[userId]) {
          userSessions[userId] = [];
        }

        userSessions[userId].push({
          startTime: session.startTime.toDate(),
          endTime: session.endTime.toDate(),
          penalty: session.penalty || 0,
        });
      });

      // Process each user's sleep data
      for (const userId in userSessions) {
        try {
          const sessions = userSessions[userId];

          // Calculate total sleep time in minutes after applying penalties
          let totalSleepMinutes = 0;

          sessions.forEach((session) => {
            const durationMinutes =
              (session.endTime.getTime() - session.startTime.getTime()) /
              (1000 * 60);
            const penaltyMinutes = session.penalty * 15; // 15 minutes per penalty
            totalSleepMinutes += Math.max(0, durationMinutes - penaltyMinutes);
          });

          const totalSleepHours = totalSleepMinutes / 60;
          logger.info(
            `User ${userId}: Total sleep time: ${totalSleepHours.toFixed(
              2,
            )} hours`,
          );

          // Update user's streak if they slept at least 7 hours
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            logger.warn(`No user document found for ID: ${userId}`);
            continue;
          }

          const userData = userDoc.data();
          const currentStreak = userData?.sleepStreak || 0;

          if (totalSleepHours >= 7) {
            // User met sleep goal, increment streak
            await userRef.update({
              sleepStreak: currentStreak + 1,
              lastStreakUpdate: Timestamp.now(),
            });
            logger.info(
              `Updated streak for user ${userId}: ${currentStreak} -> ${
                currentStreak + 1
              }`,
            );
          } else {
            // User didn't meet sleep goal, reset streak
            if (currentStreak > 0) {
              await userRef.update({
                sleepStreak: 0,
                lastStreakUpdate: Timestamp.now(),
              });
              logger.info(
                `Reset streak for user ${userId} (insufficient sleep)`,
              );
            }
          }
        } catch (err) {
          logger.error(`Error processing user ${userId}`, err);
        }
      }

      logger.info('Sleep streak update completed successfully');
    } catch (error) {
      logger.error('Error updating sleep streaks:', error);
    }
  },
);
