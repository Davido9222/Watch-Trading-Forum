import type { ForumSection } from '@/types';

export const createInitialSections = (): ForumSection[] => [
  // ============================================
  // NEW MEMBER INTRODUCTIONS
  // ============================================
  {
    id: 'sec-intro',
    name: 'New Member Introductions',
    description: 'Drop in and introduce yourself to the community!',
    slug: 'new-member-introductions',
    isClickable: true,
    order: 1,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // COMMUNITY RULES
  // ============================================
  {
    id: 'sec-rules',
    name: 'Community Rules',
    description: 'Please take a moment to read our community rules.',
    slug: 'community-rules',
    isClickable: true,
    order: 2,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // WATCH DISCUSSION FORUM
  // ============================================
  {
    id: 'sec-watch-discussion',
    name: 'Watch Discussion Forum',
    description: 'For all things watches and watch related not covered by the specialist sections of The Watch Forum',
    slug: 'watch-discussion-forum',
    isClickable: false,
    order: 3,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-articles',
    name: 'Articles',
    description: 'Watch articles and news',
    slug: 'articles',
    isClickable: true,
    parentId: 'sec-watch-discussion',
    order: 1,
    threadCount: 0,
    postCount: 0,
  },
  // ============================================
  // OWNER THREADS - Only Owner can post here
  // ============================================
  {
    id: 'sec-owner-threads',
    name: 'Owners Threads',
    description: 'Exclusive threads from the site owner',
    slug: 'owners-threads',
    isClickable: true,
    parentId: 'sec-watch-discussion',
    order: 2,
    threadCount: 0,
    postCount: 0,
    requiresOwner: true, // HERE IS THE PART ABOUT MAKING IT SO ONLY THE OWNER HAS PRIVILEGES TO POST
  },
  
  // ============================================
  // TECHNICAL QUESTIONS & GENERAL HELP
  // ============================================
  {
    id: 'sec-technical',
    name: 'Technical Questions & General Help',
    description: 'Get help with watch-related technical questions',
    slug: 'technical-questions',
    isClickable: false,
    order: 4,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-repairers',
    name: 'Watch Repairers',
    description: 'Find and discuss watch repair services',
    slug: 'watch-repairers',
    isClickable: true,
    parentId: 'sec-technical',
    order: 1,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-fake-real',
    name: 'Fake or Real?',
    description: 'Get opinions on authenticity',
    slug: 'fake-or-real',
    isClickable: true,
    parentId: 'sec-technical',
    order: 2,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // MARKETPLACE - Main container (not clickable)
  // ============================================
  {
    id: 'sec-marketplace',
    name: 'Marketplace',
    description: 'Buy, sell, and trade watches',
    slug: 'marketplace',
    isClickable: false,
    order: 5,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // UNITED KINGDOM
  // ============================================
  {
    id: 'sec-uk',
    name: 'United Kingdom',
    description: 'Watch trading in the UK',
    slug: 'united-kingdom',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 1,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-uk-london', name: 'London', description: 'Watch trading in London', slug: 'london', isClickable: true, parentId: 'sec-uk', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-manchester', name: 'Manchester', description: 'Watch trading in Manchester', slug: 'manchester', isClickable: true, parentId: 'sec-uk', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-birmingham', name: 'Birmingham', description: 'Watch trading in Birmingham', slug: 'birmingham', isClickable: true, parentId: 'sec-uk', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-glasgow', name: 'Glasgow', description: 'Watch trading in Glasgow', slug: 'glasgow', isClickable: true, parentId: 'sec-uk', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-southampton', name: 'Southampton', description: 'Watch trading in Southampton', slug: 'southampton', isClickable: true, parentId: 'sec-uk', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-liverpool', name: 'Liverpool', description: 'Watch trading in Liverpool', slug: 'liverpool', isClickable: true, parentId: 'sec-uk', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-newcastle', name: 'Newcastle upon Tyne', description: 'Watch trading in Newcastle', slug: 'newcastle', isClickable: true, parentId: 'sec-uk', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-nottingham', name: 'Nottingham', description: 'Watch trading in Nottingham', slug: 'nottingham', isClickable: true, parentId: 'sec-uk', order: 8, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-sheffield', name: 'Sheffield', description: 'Watch trading in Sheffield', slug: 'sheffield', isClickable: true, parentId: 'sec-uk', order: 9, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-bristol', name: 'Bristol', description: 'Watch trading in Bristol', slug: 'bristol', isClickable: true, parentId: 'sec-uk', order: 10, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-belfast', name: 'Belfast', description: 'Watch trading in Belfast', slug: 'belfast', isClickable: true, parentId: 'sec-uk', order: 11, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-brighton', name: 'Brighton', description: 'Watch trading in Brighton', slug: 'brighton', isClickable: true, parentId: 'sec-uk', order: 12, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-leicester', name: 'Leicester', description: 'Watch trading in Leicester', slug: 'leicester', isClickable: true, parentId: 'sec-uk', order: 13, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-scotland', name: 'Scotland', description: 'Watch trading in Scotland', slug: 'scotland', isClickable: true, parentId: 'sec-uk', order: 14, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-bournemouth', name: 'Bournemouth', description: 'Watch trading in Bournemouth', slug: 'bournemouth', isClickable: true, parentId: 'sec-uk', order: 15, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-wales', name: 'Wales', description: 'Watch trading in Wales', slug: 'wales', isClickable: true, parentId: 'sec-uk', order: 16, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-coventry', name: 'Coventry', description: 'Watch trading in Coventry', slug: 'coventry', isClickable: true, parentId: 'sec-uk', order: 17, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-leeds', name: 'Leeds', description: 'Watch trading in Leeds', slug: 'leeds', isClickable: true, parentId: 'sec-uk', order: 18, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-middlesbrough', name: 'Middlesbrough', description: 'Watch trading in Middlesbrough', slug: 'middlesbrough', isClickable: true, parentId: 'sec-uk', order: 19, threadCount: 0, postCount: 0 },
  { id: 'sec-uk-stoke', name: 'Stoke-on-Trent', description: 'Watch trading in Stoke-on-Trent', slug: 'stoke-on-trent', isClickable: true, parentId: 'sec-uk', order: 20, threadCount: 0, postCount: 0 },
  
  // ============================================
  // UNITED STATES
  // ============================================
  {
    id: 'sec-us',
    name: 'United States',
    description: 'Watch trading in the USA',
    slug: 'united-states',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 2,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-us-alabama', name: 'Alabama', description: 'Watch trading in Alabama', slug: 'alabama', isClickable: true, parentId: 'sec-us', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-us-alaska', name: 'Alaska', description: 'Watch trading in Alaska', slug: 'alaska', isClickable: true, parentId: 'sec-us', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-us-arizona', name: 'Arizona', description: 'Watch trading in Arizona', slug: 'arizona', isClickable: true, parentId: 'sec-us', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-us-arkansas', name: 'Arkansas', description: 'Watch trading in Arkansas', slug: 'arkansas', isClickable: true, parentId: 'sec-us', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-us-california', name: 'California', description: 'Watch trading in California', slug: 'california', isClickable: true, parentId: 'sec-us', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-us-colorado', name: 'Colorado', description: 'Watch trading in Colorado', slug: 'colorado', isClickable: true, parentId: 'sec-us', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-us-connecticut', name: 'Connecticut', description: 'Watch trading in Connecticut', slug: 'connecticut', isClickable: true, parentId: 'sec-us', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-us-delaware', name: 'Delaware', description: 'Watch trading in Delaware', slug: 'delaware', isClickable: true, parentId: 'sec-us', order: 8, threadCount: 0, postCount: 0 },
  { id: 'sec-us-florida', name: 'Florida', description: 'Watch trading in Florida', slug: 'florida', isClickable: true, parentId: 'sec-us', order: 9, threadCount: 0, postCount: 0 },
  { id: 'sec-us-georgia', name: 'Georgia', description: 'Watch trading in Georgia', slug: 'georgia', isClickable: true, parentId: 'sec-us', order: 10, threadCount: 0, postCount: 0 },
  { id: 'sec-us-hawaii', name: 'Hawaii', description: 'Watch trading in Hawaii', slug: 'hawaii', isClickable: true, parentId: 'sec-us', order: 11, threadCount: 0, postCount: 0 },
  { id: 'sec-us-idaho', name: 'Idaho', description: 'Watch trading in Idaho', slug: 'idaho', isClickable: true, parentId: 'sec-us', order: 12, threadCount: 0, postCount: 0 },
  { id: 'sec-us-illinois', name: 'Illinois', description: 'Watch trading in Illinois', slug: 'illinois', isClickable: true, parentId: 'sec-us', order: 13, threadCount: 0, postCount: 0 },
  { id: 'sec-us-indiana', name: 'Indiana', description: 'Watch trading in Indiana', slug: 'indiana', isClickable: true, parentId: 'sec-us', order: 14, threadCount: 0, postCount: 0 },
  { id: 'sec-us-iowa', name: 'Iowa', description: 'Watch trading in Iowa', slug: 'iowa', isClickable: true, parentId: 'sec-us', order: 15, threadCount: 0, postCount: 0 },
  { id: 'sec-us-kansas', name: 'Kansas', description: 'Watch trading in Kansas', slug: 'kansas', isClickable: true, parentId: 'sec-us', order: 16, threadCount: 0, postCount: 0 },
  { id: 'sec-us-kentucky', name: 'Kentucky', description: 'Watch trading in Kentucky', slug: 'kentucky', isClickable: true, parentId: 'sec-us', order: 17, threadCount: 0, postCount: 0 },
  { id: 'sec-us-louisiana', name: 'Louisiana', description: 'Watch trading in Louisiana', slug: 'louisiana', isClickable: true, parentId: 'sec-us', order: 18, threadCount: 0, postCount: 0 },
  { id: 'sec-us-maine', name: 'Maine', description: 'Watch trading in Maine', slug: 'maine', isClickable: true, parentId: 'sec-us', order: 19, threadCount: 0, postCount: 0 },
  { id: 'sec-us-maryland', name: 'Maryland', description: 'Watch trading in Maryland', slug: 'maryland', isClickable: true, parentId: 'sec-us', order: 20, threadCount: 0, postCount: 0 },
  { id: 'sec-us-massachusetts', name: 'Massachusetts', description: 'Watch trading in Massachusetts', slug: 'massachusetts', isClickable: true, parentId: 'sec-us', order: 21, threadCount: 0, postCount: 0 },
  { id: 'sec-us-michigan', name: 'Michigan', description: 'Watch trading in Michigan', slug: 'michigan', isClickable: true, parentId: 'sec-us', order: 22, threadCount: 0, postCount: 0 },
  { id: 'sec-us-minnesota', name: 'Minnesota', description: 'Watch trading in Minnesota', slug: 'minnesota', isClickable: true, parentId: 'sec-us', order: 23, threadCount: 0, postCount: 0 },
  { id: 'sec-us-mississippi', name: 'Mississippi', description: 'Watch trading in Mississippi', slug: 'mississippi', isClickable: true, parentId: 'sec-us', order: 24, threadCount: 0, postCount: 0 },
  { id: 'sec-us-missouri', name: 'Missouri', description: 'Watch trading in Missouri', slug: 'missouri', isClickable: true, parentId: 'sec-us', order: 25, threadCount: 0, postCount: 0 },
  { id: 'sec-us-montana', name: 'Montana', description: 'Watch trading in Montana', slug: 'montana', isClickable: true, parentId: 'sec-us', order: 26, threadCount: 0, postCount: 0 },
  { id: 'sec-us-nebraska', name: 'Nebraska', description: 'Watch trading in Nebraska', slug: 'nebraska', isClickable: true, parentId: 'sec-us', order: 27, threadCount: 0, postCount: 0 },
  { id: 'sec-us-nevada', name: 'Nevada', description: 'Watch trading in Nevada', slug: 'nevada', isClickable: true, parentId: 'sec-us', order: 28, threadCount: 0, postCount: 0 },
  { id: 'sec-us-newhampshire', name: 'New Hampshire', description: 'Watch trading in New Hampshire', slug: 'new-hampshire', isClickable: true, parentId: 'sec-us', order: 29, threadCount: 0, postCount: 0 },
  { id: 'sec-us-newjersey', name: 'New Jersey', description: 'Watch trading in New Jersey', slug: 'new-jersey', isClickable: true, parentId: 'sec-us', order: 30, threadCount: 0, postCount: 0 },
  { id: 'sec-us-newmexico', name: 'New Mexico', description: 'Watch trading in New Mexico', slug: 'new-mexico', isClickable: true, parentId: 'sec-us', order: 31, threadCount: 0, postCount: 0 },
  { id: 'sec-us-newyork', name: 'New York', description: 'Watch trading in New York', slug: 'new-york', isClickable: true, parentId: 'sec-us', order: 32, threadCount: 0, postCount: 0 },
  { id: 'sec-us-northcarolina', name: 'North Carolina', description: 'Watch trading in North Carolina', slug: 'north-carolina', isClickable: true, parentId: 'sec-us', order: 33, threadCount: 0, postCount: 0 },
  { id: 'sec-us-northdakota', name: 'North Dakota', description: 'Watch trading in North Dakota', slug: 'north-dakota', isClickable: true, parentId: 'sec-us', order: 34, threadCount: 0, postCount: 0 },
  { id: 'sec-us-ohio', name: 'Ohio', description: 'Watch trading in Ohio', slug: 'ohio', isClickable: true, parentId: 'sec-us', order: 35, threadCount: 0, postCount: 0 },
  { id: 'sec-us-oklahoma', name: 'Oklahoma', description: 'Watch trading in Oklahoma', slug: 'oklahoma', isClickable: true, parentId: 'sec-us', order: 36, threadCount: 0, postCount: 0 },
  { id: 'sec-us-oregon', name: 'Oregon', description: 'Watch trading in Oregon', slug: 'oregon', isClickable: true, parentId: 'sec-us', order: 37, threadCount: 0, postCount: 0 },
  { id: 'sec-us-pennsylvania', name: 'Pennsylvania', description: 'Watch trading in Pennsylvania', slug: 'pennsylvania', isClickable: true, parentId: 'sec-us', order: 38, threadCount: 0, postCount: 0 },
  { id: 'sec-us-rhodeisland', name: 'Rhode Island', description: 'Watch trading in Rhode Island', slug: 'rhode-island', isClickable: true, parentId: 'sec-us', order: 39, threadCount: 0, postCount: 0 },
  { id: 'sec-us-southcarolina', name: 'South Carolina', description: 'Watch trading in South Carolina', slug: 'south-carolina', isClickable: true, parentId: 'sec-us', order: 40, threadCount: 0, postCount: 0 },
  { id: 'sec-us-southdakota', name: 'South Dakota', description: 'Watch trading in South Dakota', slug: 'south-dakota', isClickable: true, parentId: 'sec-us', order: 41, threadCount: 0, postCount: 0 },
  { id: 'sec-us-tennessee', name: 'Tennessee', description: 'Watch trading in Tennessee', slug: 'tennessee', isClickable: true, parentId: 'sec-us', order: 42, threadCount: 0, postCount: 0 },
  { id: 'sec-us-texas', name: 'Texas', description: 'Watch trading in Texas', slug: 'texas', isClickable: true, parentId: 'sec-us', order: 43, threadCount: 0, postCount: 0 },
  { id: 'sec-us-utah', name: 'Utah', description: 'Watch trading in Utah', slug: 'utah', isClickable: true, parentId: 'sec-us', order: 44, threadCount: 0, postCount: 0 },
  { id: 'sec-us-vermont', name: 'Vermont', description: 'Watch trading in Vermont', slug: 'vermont', isClickable: true, parentId: 'sec-us', order: 45, threadCount: 0, postCount: 0 },
  { id: 'sec-us-virginia', name: 'Virginia', description: 'Watch trading in Virginia', slug: 'virginia', isClickable: true, parentId: 'sec-us', order: 46, threadCount: 0, postCount: 0 },
  { id: 'sec-us-washington', name: 'Washington', description: 'Watch trading in Washington', slug: 'washington', isClickable: true, parentId: 'sec-us', order: 47, threadCount: 0, postCount: 0 },
  { id: 'sec-us-westvirginia', name: 'West Virginia', description: 'Watch trading in West Virginia', slug: 'west-virginia', isClickable: true, parentId: 'sec-us', order: 48, threadCount: 0, postCount: 0 },
  { id: 'sec-us-wisconsin', name: 'Wisconsin', description: 'Watch trading in Wisconsin', slug: 'wisconsin', isClickable: true, parentId: 'sec-us', order: 49, threadCount: 0, postCount: 0 },
  { id: 'sec-us-wyoming', name: 'Wyoming', description: 'Watch trading in Wyoming', slug: 'wyoming', isClickable: true, parentId: 'sec-us', order: 50, threadCount: 0, postCount: 0 },
  
  // ============================================
  // NETHERLANDS
  // ============================================
  {
    id: 'sec-nl',
    name: 'Netherlands',
    description: 'Watch trading in the Netherlands',
    slug: 'netherlands',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 3,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-nl-drenthe', name: 'Drenthe', description: 'Watch trading in Drenthe', slug: 'drenthe', isClickable: true, parentId: 'sec-nl', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-flevoland', name: 'Flevoland', description: 'Watch trading in Flevoland', slug: 'flevoland', isClickable: true, parentId: 'sec-nl', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-friesland', name: 'Friesland', description: 'Watch trading in Friesland', slug: 'friesland', isClickable: true, parentId: 'sec-nl', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-gelderland', name: 'Gelderland', description: 'Watch trading in Gelderland', slug: 'gelderland', isClickable: true, parentId: 'sec-nl', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-groningen', name: 'Groningen', description: 'Watch trading in Groningen', slug: 'groningen', isClickable: true, parentId: 'sec-nl', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-limburg', name: 'Limburg', description: 'Watch trading in Limburg', slug: 'limburg', isClickable: true, parentId: 'sec-nl', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-northbrabant', name: 'North Brabant', description: 'Watch trading in North Brabant', slug: 'north-brabant', isClickable: true, parentId: 'sec-nl', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-northholland', name: 'North Holland', description: 'Watch trading in North Holland', slug: 'north-holland', isClickable: true, parentId: 'sec-nl', order: 8, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-overijssel', name: 'Overijssel', description: 'Watch trading in Overijssel', slug: 'overijssel', isClickable: true, parentId: 'sec-nl', order: 9, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-southholland', name: 'South Holland', description: 'Watch trading in South Holland', slug: 'south-holland', isClickable: true, parentId: 'sec-nl', order: 10, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-utrecht', name: 'Utrecht', description: 'Watch trading in Utrecht', slug: 'utrecht', isClickable: true, parentId: 'sec-nl', order: 11, threadCount: 0, postCount: 0 },
  { id: 'sec-nl-zeeland', name: 'Zeeland', description: 'Watch trading in Zeeland', slug: 'zeeland', isClickable: true, parentId: 'sec-nl', order: 12, threadCount: 0, postCount: 0 },
  
  // ============================================
  // BELGIUM
  // ============================================
  {
    id: 'sec-be',
    name: 'Belgium',
    description: 'Watch trading in Belgium',
    slug: 'belgium',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 4,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-be-flanders', name: 'Flanders', description: 'Watch trading in Flanders', slug: 'flanders', isClickable: false, parentId: 'sec-be', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-be-antwerp', name: 'Antwerp', description: 'Watch trading in Antwerp', slug: 'antwerp', isClickable: true, parentId: 'sec-be-flanders', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-be-eastflanders', name: 'East Flanders', description: 'Watch trading in East Flanders', slug: 'east-flanders', isClickable: true, parentId: 'sec-be-flanders', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-be-flemishbrabant', name: 'Flemish Brabant', description: 'Watch trading in Flemish Brabant', slug: 'flemish-brabant', isClickable: true, parentId: 'sec-be-flanders', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-be-limburg', name: 'Limburg', description: 'Watch trading in Limburg', slug: 'limburg-be', isClickable: true, parentId: 'sec-be-flanders', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-be-westflanders', name: 'West Flanders', description: 'Watch trading in West Flanders', slug: 'west-flanders', isClickable: true, parentId: 'sec-be-flanders', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-be-wallonia', name: 'Wallonia', description: 'Watch trading in Wallonia', slug: 'wallonia', isClickable: false, parentId: 'sec-be', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-be-hainaut', name: 'Hainaut', description: 'Watch trading in Hainaut', slug: 'hainaut', isClickable: true, parentId: 'sec-be-wallonia', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-be-liege', name: 'Liège', description: 'Watch trading in Liège', slug: 'liege', isClickable: true, parentId: 'sec-be-wallonia', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-be-luxembourg', name: 'Luxembourg', description: 'Watch trading in Luxembourg', slug: 'luxembourg-be', isClickable: true, parentId: 'sec-be-wallonia', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-be-namur', name: 'Namur', description: 'Watch trading in Namur', slug: 'namur', isClickable: true, parentId: 'sec-be-wallonia', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-be-walloonbrabant', name: 'Walloon Brabant', description: 'Watch trading in Walloon Brabant', slug: 'walloon-brabant', isClickable: true, parentId: 'sec-be-wallonia', order: 5, threadCount: 0, postCount: 0 },
  
  // ============================================
  // CANADA
  // ============================================
  {
    id: 'sec-ca',
    name: 'Canada',
    description: 'Watch trading in Canada',
    slug: 'canada',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 5,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-ca-alberta', name: 'Alberta', description: 'Watch trading in Alberta', slug: 'alberta', isClickable: true, parentId: 'sec-ca', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-britishcolumbia', name: 'British Columbia', description: 'Watch trading in British Columbia', slug: 'british-columbia', isClickable: true, parentId: 'sec-ca', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-manitoba', name: 'Manitoba', description: 'Watch trading in Manitoba', slug: 'manitoba', isClickable: true, parentId: 'sec-ca', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-newbrunswick', name: 'New Brunswick', description: 'Watch trading in New Brunswick', slug: 'new-brunswick', isClickable: true, parentId: 'sec-ca', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-newfoundland', name: 'Newfoundland and Labrador', description: 'Watch trading in Newfoundland and Labrador', slug: 'newfoundland-labrador', isClickable: true, parentId: 'sec-ca', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-novascotia', name: 'Nova Scotia', description: 'Watch trading in Nova Scotia', slug: 'nova-scotia', isClickable: true, parentId: 'sec-ca', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-ontario', name: 'Ontario', description: 'Watch trading in Ontario', slug: 'ontario', isClickable: true, parentId: 'sec-ca', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-princeedward', name: 'Prince Edward Island', description: 'Watch trading in Prince Edward Island', slug: 'prince-edward-island', isClickable: true, parentId: 'sec-ca', order: 8, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-quebec', name: 'Quebec', description: 'Watch trading in Quebec', slug: 'quebec', isClickable: true, parentId: 'sec-ca', order: 9, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-saskatchewan', name: 'Saskatchewan', description: 'Watch trading in Saskatchewan', slug: 'saskatchewan', isClickable: true, parentId: 'sec-ca', order: 10, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-northwest', name: 'Northwest Territories', description: 'Watch trading in Northwest Territories', slug: 'northwest-territories', isClickable: true, parentId: 'sec-ca', order: 11, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-nunavut', name: 'Nunavut', description: 'Watch trading in Nunavut', slug: 'nunavut', isClickable: true, parentId: 'sec-ca', order: 12, threadCount: 0, postCount: 0 },
  { id: 'sec-ca-yukon', name: 'Yukon', description: 'Watch trading in Yukon', slug: 'yukon', isClickable: true, parentId: 'sec-ca', order: 13, threadCount: 0, postCount: 0 },
  
  // ============================================
  // AUSTRALIA
  // ============================================
  {
    id: 'sec-au',
    name: 'Australia',
    description: 'Watch trading in Australia',
    slug: 'australia',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 6,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-au-nsw', name: 'New South Wales', description: 'Watch trading in New South Wales', slug: 'new-south-wales', isClickable: true, parentId: 'sec-au', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-au-queensland', name: 'Queensland', description: 'Watch trading in Queensland', slug: 'queensland', isClickable: true, parentId: 'sec-au', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-au-south', name: 'South Australia', description: 'Watch trading in South Australia', slug: 'south-australia', isClickable: true, parentId: 'sec-au', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-au-tasmania', name: 'Tasmania', description: 'Watch trading in Tasmania', slug: 'tasmania', isClickable: true, parentId: 'sec-au', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-au-victoria', name: 'Victoria', description: 'Watch trading in Victoria', slug: 'victoria', isClickable: true, parentId: 'sec-au', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-au-western', name: 'Western Australia', description: 'Watch trading in Western Australia', slug: 'western-australia', isClickable: true, parentId: 'sec-au', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-au-act', name: 'Australian Capital Territory', description: 'Watch trading in ACT', slug: 'act', isClickable: true, parentId: 'sec-au', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-au-northern', name: 'Northern Territory', description: 'Watch trading in Northern Territory', slug: 'northern-territory', isClickable: true, parentId: 'sec-au', order: 8, threadCount: 0, postCount: 0 },
  
  // ============================================
  // NEW ZEALAND
  // ============================================
  {
    id: 'sec-nz',
    name: 'New Zealand',
    description: 'Watch trading in New Zealand',
    slug: 'new-zealand',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 7,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-nz-northland', name: 'Northland', description: 'Watch trading in Northland', slug: 'northland', isClickable: true, parentId: 'sec-nz', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-auckland', name: 'Auckland', description: 'Watch trading in Auckland', slug: 'auckland', isClickable: true, parentId: 'sec-nz', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-waikato', name: 'Waikato', description: 'Watch trading in Waikato', slug: 'waikato', isClickable: true, parentId: 'sec-nz', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-bayofplenty', name: 'Bay of Plenty', description: 'Watch trading in Bay of Plenty', slug: 'bay-of-plenty', isClickable: true, parentId: 'sec-nz', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-gisborne', name: 'Gisborne', description: 'Watch trading in Gisborne', slug: 'gisborne', isClickable: true, parentId: 'sec-nz', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-hawkesbay', name: 'Hawke\'s Bay', description: 'Watch trading in Hawke\'s Bay', slug: 'hawkes-bay', isClickable: true, parentId: 'sec-nz', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-taranaki', name: 'Taranaki', description: 'Watch trading in Taranaki', slug: 'taranaki', isClickable: true, parentId: 'sec-nz', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-manawatu', name: 'Manawatū-Whanganui', description: 'Watch trading in Manawatū-Whanganui', slug: 'manawatu-whanganui', isClickable: true, parentId: 'sec-nz', order: 8, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-wellington', name: 'Wellington', description: 'Watch trading in Wellington', slug: 'wellington', isClickable: true, parentId: 'sec-nz', order: 9, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-tasman', name: 'Tasman', description: 'Watch trading in Tasman', slug: 'tasman', isClickable: true, parentId: 'sec-nz', order: 10, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-nelson', name: 'Nelson', description: 'Watch trading in Nelson', slug: 'nelson', isClickable: true, parentId: 'sec-nz', order: 11, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-marlborough', name: 'Marlborough', description: 'Watch trading in Marlborough', slug: 'marlborough', isClickable: true, parentId: 'sec-nz', order: 12, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-westcoast', name: 'West Coast', description: 'Watch trading in West Coast', slug: 'west-coast', isClickable: true, parentId: 'sec-nz', order: 13, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-canterbury', name: 'Canterbury', description: 'Watch trading in Canterbury', slug: 'canterbury', isClickable: true, parentId: 'sec-nz', order: 14, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-otago', name: 'Otago', description: 'Watch trading in Otago', slug: 'otago', isClickable: true, parentId: 'sec-nz', order: 15, threadCount: 0, postCount: 0 },
  { id: 'sec-nz-southland', name: 'Southland', description: 'Watch trading in Southland', slug: 'southland', isClickable: true, parentId: 'sec-nz', order: 16, threadCount: 0, postCount: 0 },
  
  // ============================================
  // ASIA
  // ============================================
  {
    id: 'sec-asia',
    name: 'Asia',
    description: 'Watch trading in Asia',
    slug: 'asia',
    isClickable: false,
    parentId: 'sec-marketplace',
    order: 8,
    threadCount: 0,
    postCount: 0,
  },
  { id: 'sec-asia-afghanistan', name: 'Afghanistan', description: 'Watch trading in Afghanistan', slug: 'afghanistan', isClickable: true, parentId: 'sec-asia', order: 1, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-armenia', name: 'Armenia', description: 'Watch trading in Armenia', slug: 'armenia', isClickable: true, parentId: 'sec-asia', order: 2, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-azerbaijan', name: 'Azerbaijan', description: 'Watch trading in Azerbaijan', slug: 'azerbaijan', isClickable: true, parentId: 'sec-asia', order: 3, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-bahrain', name: 'Bahrain', description: 'Watch trading in Bahrain', slug: 'bahrain', isClickable: true, parentId: 'sec-asia', order: 4, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-bangladesh', name: 'Bangladesh', description: 'Watch trading in Bangladesh', slug: 'bangladesh', isClickable: true, parentId: 'sec-asia', order: 5, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-bhutan', name: 'Bhutan', description: 'Watch trading in Bhutan', slug: 'bhutan', isClickable: true, parentId: 'sec-asia', order: 6, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-brunei', name: 'Brunei', description: 'Watch trading in Brunei', slug: 'brunei', isClickable: true, parentId: 'sec-asia', order: 7, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-cambodia', name: 'Cambodia', description: 'Watch trading in Cambodia', slug: 'cambodia', isClickable: true, parentId: 'sec-asia', order: 8, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-china', name: 'China', description: 'Watch trading in China', slug: 'china', isClickable: true, parentId: 'sec-asia', order: 9, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-cyprus', name: 'Cyprus', description: 'Watch trading in Cyprus', slug: 'cyprus', isClickable: true, parentId: 'sec-asia', order: 10, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-georgia', name: 'Georgia', description: 'Watch trading in Georgia', slug: 'georgia-asia', isClickable: true, parentId: 'sec-asia', order: 11, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-india', name: 'India', description: 'Watch trading in India', slug: 'india', isClickable: true, parentId: 'sec-asia', order: 12, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-indonesia', name: 'Indonesia', description: 'Watch trading in Indonesia', slug: 'indonesia', isClickable: true, parentId: 'sec-asia', order: 13, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-iran', name: 'Iran', description: 'Watch trading in Iran', slug: 'iran', isClickable: true, parentId: 'sec-asia', order: 14, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-iraq', name: 'Iraq', description: 'Watch trading in Iraq', slug: 'iraq', isClickable: true, parentId: 'sec-asia', order: 15, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-israel', name: 'Israel', description: 'Watch trading in Israel', slug: 'israel', isClickable: true, parentId: 'sec-asia', order: 16, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-japan', name: 'Japan', description: 'Watch trading in Japan', slug: 'japan', isClickable: true, parentId: 'sec-asia', order: 17, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-jordan', name: 'Jordan', description: 'Watch trading in Jordan', slug: 'jordan', isClickable: true, parentId: 'sec-asia', order: 18, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-kazakhstan', name: 'Kazakhstan', description: 'Watch trading in Kazakhstan', slug: 'kazakhstan', isClickable: true, parentId: 'sec-asia', order: 19, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-kuwait', name: 'Kuwait', description: 'Watch trading in Kuwait', slug: 'kuwait', isClickable: true, parentId: 'sec-asia', order: 20, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-kyrgyzstan', name: 'Kyrgyzstan', description: 'Watch trading in Kyrgyzstan', slug: 'kyrgyzstan', isClickable: true, parentId: 'sec-asia', order: 21, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-laos', name: 'Laos', description: 'Watch trading in Laos', slug: 'laos', isClickable: true, parentId: 'sec-asia', order: 22, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-lebanon', name: 'Lebanon', description: 'Watch trading in Lebanon', slug: 'lebanon', isClickable: true, parentId: 'sec-asia', order: 23, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-malaysia', name: 'Malaysia', description: 'Watch trading in Malaysia', slug: 'malaysia', isClickable: true, parentId: 'sec-asia', order: 24, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-maldives', name: 'Maldives', description: 'Watch trading in Maldives', slug: 'maldives', isClickable: true, parentId: 'sec-asia', order: 25, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-mongolia', name: 'Mongolia', description: 'Watch trading in Mongolia', slug: 'mongolia', isClickable: true, parentId: 'sec-asia', order: 26, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-myanmar', name: 'Myanmar (Burma)', description: 'Watch trading in Myanmar', slug: 'myanmar', isClickable: true, parentId: 'sec-asia', order: 27, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-nepal', name: 'Nepal', description: 'Watch trading in Nepal', slug: 'nepal', isClickable: true, parentId: 'sec-asia', order: 28, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-northkorea', name: 'North Korea', description: 'Watch trading in North Korea', slug: 'north-korea', isClickable: true, parentId: 'sec-asia', order: 29, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-oman', name: 'Oman', description: 'Watch trading in Oman', slug: 'oman', isClickable: true, parentId: 'sec-asia', order: 30, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-pakistan', name: 'Pakistan', description: 'Watch trading in Pakistan', slug: 'pakistan', isClickable: true, parentId: 'sec-asia', order: 31, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-palestine', name: 'Palestine', description: 'Watch trading in Palestine', slug: 'palestine', isClickable: true, parentId: 'sec-asia', order: 32, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-philippines', name: 'Philippines', description: 'Watch trading in Philippines', slug: 'philippines', isClickable: true, parentId: 'sec-asia', order: 33, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-qatar', name: 'Qatar', description: 'Watch trading in Qatar', slug: 'qatar', isClickable: true, parentId: 'sec-asia', order: 34, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-saudiarabia', name: 'Saudi Arabia', description: 'Watch trading in Saudi Arabia', slug: 'saudi-arabia', isClickable: true, parentId: 'sec-asia', order: 35, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-singapore', name: 'Singapore', description: 'Watch trading in Singapore', slug: 'singapore', isClickable: true, parentId: 'sec-asia', order: 36, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-southkorea', name: 'South Korea', description: 'Watch trading in South Korea', slug: 'south-korea', isClickable: true, parentId: 'sec-asia', order: 37, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-srilanka', name: 'Sri Lanka', description: 'Watch trading in Sri Lanka', slug: 'sri-lanka', isClickable: true, parentId: 'sec-asia', order: 38, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-syria', name: 'Syria', description: 'Watch trading in Syria', slug: 'syria', isClickable: true, parentId: 'sec-asia', order: 39, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-taiwan', name: 'Taiwan', description: 'Watch trading in Taiwan', slug: 'taiwan', isClickable: true, parentId: 'sec-asia', order: 40, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-tajikistan', name: 'Tajikistan', description: 'Watch trading in Tajikistan', slug: 'tajikistan', isClickable: true, parentId: 'sec-asia', order: 41, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-thailand', name: 'Thailand', description: 'Watch trading in Thailand', slug: 'thailand', isClickable: true, parentId: 'sec-asia', order: 42, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-timorleste', name: 'Timor-Leste', description: 'Watch trading in Timor-Leste', slug: 'timor-leste', isClickable: true, parentId: 'sec-asia', order: 43, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-turkey', name: 'Turkey', description: 'Watch trading in Turkey', slug: 'turkey', isClickable: true, parentId: 'sec-asia', order: 44, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-turkmenistan', name: 'Turkmenistan', description: 'Watch trading in Turkmenistan', slug: 'turkmenistan', isClickable: true, parentId: 'sec-asia', order: 45, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-uae', name: 'United Arab Emirates', description: 'Watch trading in UAE', slug: 'uae', isClickable: true, parentId: 'sec-asia', order: 46, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-uzbekistan', name: 'Uzbekistan', description: 'Watch trading in Uzbekistan', slug: 'uzbekistan', isClickable: true, parentId: 'sec-asia', order: 47, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-vietnam', name: 'Vietnam', description: 'Watch trading in Vietnam', slug: 'vietnam', isClickable: true, parentId: 'sec-asia', order: 48, threadCount: 0, postCount: 0 },
  { id: 'sec-asia-yemen', name: 'Yemen', description: 'Watch trading in Yemen', slug: 'yemen', isClickable: true, parentId: 'sec-asia', order: 49, threadCount: 0, postCount: 0 },
  
  // ============================================
  // WATCH BRAND SECTIONS
  // ============================================
  {
    id: 'sec-rolex',
    name: 'Rolex Watches',
    description: 'Discussion and trading of Rolex timepieces',
    slug: 'rolex-watches',
    isClickable: true,
    order: 6,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-patek',
    name: 'Patek Philippe Watches',
    description: 'Discussion and trading of Patek Philippe timepieces',
    slug: 'patek-philippe-watches',
    isClickable: true,
    order: 7,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-ap',
    name: 'Audemars Piguet Watches',
    description: 'Discussion and trading of Audemars Piguet timepieces',
    slug: 'audemars-piguet-watches',
    isClickable: true,
    order: 8,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-omega',
    name: 'Omega Watches',
    description: 'Discussion and trading of Omega timepieces',
    slug: 'omega-watches',
    isClickable: true,
    order: 9,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-tag',
    name: 'Tag Heuer Watches',
    description: 'Discussion and trading of Tag Heuer timepieces',
    slug: 'tag-heuer-watches',
    isClickable: true,
    order: 10,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-cartier',
    name: 'Cartier Watches',
    description: 'Discussion and trading of Cartier timepieces',
    slug: 'cartier-watches',
    isClickable: true,
    order: 11,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-jlc',
    name: 'Jaeger-LeCoultre Watches',
    description: 'Discussion and trading of Jaeger-LeCoultre timepieces',
    slug: 'jaeger-lecoultre-watches',
    isClickable: true,
    order: 12,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-iwc',
    name: 'IWC Schaffhausen Watches',
    description: 'Discussion and trading of IWC timepieces',
    slug: 'iwc-watches',
    isClickable: true,
    order: 13,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-panerai',
    name: 'Panerai Watches',
    description: 'Discussion and trading of Panerai timepieces',
    slug: 'panerai-watches',
    isClickable: true,
    order: 14,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-tudor',
    name: 'Tudor Watches',
    description: 'Discussion and trading of Tudor timepieces',
    slug: 'tudor-watches',
    isClickable: true,
    order: 15,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // POST YOUR WATCH IMAGES
  // ============================================
  {
    id: 'sec-images',
    name: 'Post Your Watch Images',
    description: 'Share photos of your watch collection',
    slug: 'post-your-watch-images',
    isClickable: true,
    order: 16,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // ON SPOTTING FAKES
  // ============================================
  {
    id: 'sec-fakes',
    name: 'On Spotting Fakes',
    description: 'Learn how to identify counterfeit watches',
    slug: 'on-spotting-fakes',
    isClickable: true,
    order: 17,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // DIAMONDS & GEMSTONES
  // ============================================
  {
    id: 'sec-diamonds',
    name: 'Diamonds & Gemstones',
    description: 'Discussion about precious stones in watches',
    slug: 'diamonds-gemstones',
    isClickable: true,
    order: 18,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // PRECIOUS METALS
  // ============================================
  {
    id: 'sec-metals',
    name: 'Precious Metals',
    description: 'Gold, platinum, and other precious metals in watches',
    slug: 'precious-metals',
    isClickable: true,
    order: 19,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // ENGRAVINGS
  // ============================================
  {
    id: 'sec-engravings',
    name: 'Engravings',
    description: 'Watch engravings and customization',
    slug: 'engravings',
    isClickable: true,
    order: 20,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // SKELETON / OPENWORK DESIGN
  // ============================================
  {
    id: 'sec-skeleton',
    name: 'Skeleton / Openwork Design',
    description: 'Discussion of skeleton and openwork watches',
    slug: 'skeleton-openwork',
    isClickable: true,
    order: 21,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // SPECIAL DIALS / FINISHES
  // ============================================
  {
    id: 'sec-dials',
    name: 'Special Dials / Finishes',
    description: 'Unique dial designs and finishes',
    slug: 'special-dials-finishes',
    isClickable: true,
    order: 22,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // OFF TOPIC DISCUSSIONS
  // ============================================
  {
    id: 'sec-offtopic',
    name: 'Off Topic Discussions',
    description: 'Non-Watch Interests & Hobbies',
    slug: 'off-topic',
    isClickable: true,
    order: 23,
    threadCount: 0,
    postCount: 0,
  },
  
  // ============================================
  // FORUM SUPPORT
  // ============================================
  {
    id: 'sec-support',
    name: 'Forum Support',
    description: 'Site Help and Suggestions',
    slug: 'forum-support',
    isClickable: false,
    order: 24,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-help',
    name: 'Site Help and Suggestions',
    description: 'Get help with using the forum',
    slug: 'site-help',
    isClickable: true,
    parentId: 'sec-support',
    order: 1,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-report',
    name: 'Report a User',
    description: 'Report inappropriate behavior',
    slug: 'report-user',
    isClickable: true,
    parentId: 'sec-support',
    order: 2,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-petition',
    name: 'Petition a Ban',
    description: 'Appeal a ban or suspension',
    slug: 'petition-ban',
    isClickable: true,
    parentId: 'sec-support',
    order: 3,
    threadCount: 0,
    postCount: 0,
  },
  {
    id: 'sec-hacked',
    name: 'Hacked Accounts',
    description: 'Report and recover hacked accounts',
    slug: 'hacked-accounts',
    isClickable: true,
    parentId: 'sec-support',
    order: 4,
    threadCount: 0,
    postCount: 0,
  },
];