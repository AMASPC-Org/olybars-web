import { z } from 'zod';

/**
 * Native Google GenAI Function Declarations for Artie
 * Following Phase 1 of Operation Zenith.
 */
export const ARTIE_TOOLS = [
    {
        name: 'venueSearch',
        description: 'Search for venues, bars, and their happy hours in Olympia.',
        parameters: {
            type: 'OBJECT',
            properties: {
                query: {
                    type: 'STRING',
                    description: 'The search query for venue name, vibe, or keywords (e.g., "dive bar", "karaoke", "Well 80").'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'knowledgeSearch',
        description: 'Search the OlyBars Playbook/FAQ for rules, app help, and league info.',
        parameters: {
            type: 'OBJECT',
            properties: {
                query: {
                    type: 'STRING',
                    description: 'The question or keywords to search in the Playbook (e.g., "clock-in limits", "how to earn points").'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'leagueLeaderboard',
        description: 'Get the current OlyBars League standings and leaderboards.',
        parameters: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'eventDiscovery',
        description: 'Find sanctioned OlyBars League events like Trivia, Karaoke, and Pool.',
        parameters: {
            type: 'object',
            properties: {
                type: { type: 'string', description: 'Type of event to find.' }
            }
        }
    },
    {
        name: 'makerSpotlight',
        description: 'Spotlight OlyBars Local Makers - the breweries, wineries, and distilleries.',
        parameters: {
            type: 'object',
            properties: {
                type: { type: 'string', description: 'Type of maker to spotlight.' }
            }
        }
    },
    {
        name: 'operatorAction',
        description: 'Trigger a venue operator action or skill (owner/manager only). Use this for updating deals, hours, or venue info.',
        parameters: {
            type: 'OBJECT',
            properties: {
                skill_id: {
                    type: 'STRING',
                    description: 'The ID of the action to perform (e.g., "schedule_flash_deal", "update_happy_hour").'
                }
            },
            required: ['skill_id']
        }
    },
    {
        name: 'lookup_weather',
        description: 'Get the current weather conditions in Olympia, WA to filter venue recommendations (Indoor/Outdoor).',
        parameters: {
            type: 'object',
            properties: {}
        }
    }
];
