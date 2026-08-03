import { Redis } from 'ioredis';
import { STREAMS, DevFlowEvent } from '@devflow/shared';
import { Scheduler } from '@devflow/scheduler';
import { handleJobEvents } from '../engine/handleJobEvents.js';

/**
 * Starts a background polling loop that reads from the Event Bus Redis Stream using consumer groups.
 * @param redis Redis client instance.
 * @param scheduler Scheduler instance.
 */
export async function startEventBusConsumer(
  redis: any,
  scheduler: Scheduler
): Promise<void> {
  const consumerGroup = 'execution-group';
  const consumerName = `engine-consumer-${Math.random().toString(36).substring(2, 9)}`;

  // 1. Create the Redis Streams consumer group. Ignored if already exists (BUSYGROUP).
  try {
    await redis.xgroup('CREATE', STREAMS.JOB_EVENTS, consumerGroup, '$', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) {
      console.error('Failed to create Redis Streams consumer group:', err);
    }
  }

  console.log(`Event Bus Consumer Group: ${consumerGroup}, Consumer Name: ${consumerName} listening...`);

  // 2. Poll loop in the background
  (async () => {
    while (true) {
      try {
        const streams = (await redis.xreadgroup(
          'GROUP',
          consumerGroup,
          consumerName,
          'COUNT',
          10,
          'BLOCK',
          2000,
          'STREAMS',
          STREAMS.JOB_EVENTS,
          '>'
        )) as any;

        if (!streams) continue;

        for (const streamInfo of streams) {
          const [, messages] = streamInfo;
          for (const message of messages) {
            const [messageId, fields] = message;

            let payloadStr = '';
            for (let i = 0; i < fields.length; i += 2) {
              if (fields[i] === 'payload') {
                payloadStr = fields[i + 1];
                break;
              }
            }

            if (payloadStr) {
              const event = JSON.parse(payloadStr) as DevFlowEvent;
              try {
                await handleJobEvents(event, scheduler);
              } catch (handleErr) {
                console.error(`Error processing event ${event.type}:`, handleErr);
              }
            }

            // Acknowledge the message (removes from PEL)
            await redis.xack(STREAMS.JOB_EVENTS, consumerGroup, messageId);
          }
        }
      } catch (err: any) {
        console.error('Error polling Redis Streams Event Bus:', err);
        // Sleep on error to prevent cpu hammering
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  })();
}
