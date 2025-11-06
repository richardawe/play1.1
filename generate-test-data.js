#!/usr/bin/env node

/**
 * Test Data Generator for Vector Operations
 * 
 * Generates sample data for testing vector operations at scale
 */

const fs = require('fs');
const path = require('path');

// Sample content templates
const contentTemplates = {
    technical: [
        "The implementation of {technology} requires careful consideration of {aspect}. Key factors include {factor1}, {factor2}, and {factor3}. Best practices suggest {practice}.",
        "When working with {technology}, developers should focus on {focus}. This involves {involvement1}, {involvement2}, and {involvement3}. The result is {result}.",
        "The architecture of {system} is based on {principle}. This enables {capability1}, {capability2}, and {capability3}. Performance is optimized through {optimization}."
    ],
    business: [
        "The project {project} aims to {goal}. Key stakeholders include {stakeholder1}, {stakeholder2}, and {stakeholder3}. Success metrics are {metric1}, {metric2}, and {metric3}.",
        "Our strategy for {initiative} focuses on {focus}. This involves {involvement1}, {involvement2}, and {involvement3}. Expected outcomes include {outcome1} and {outcome2}.",
        "The quarterly review of {department} shows {trend}. Key achievements include {achievement1}, {achievement2}, and {achievement3}. Areas for improvement are {improvement1} and {improvement2}."
    ],
    personal: [
        "Today I worked on {task} which involved {involvement}. The main challenges were {challenge1}, {challenge2}, and {challenge3}. I learned {learning}.",
        "My goals for this week include {goal1}, {goal2}, and {goal3}. I plan to achieve these by {method1}, {method2}, and {method3}. The expected outcome is {outcome}.",
        "I attended {event} where we discussed {topic}. Key takeaways include {takeaway1}, {takeaway2}, and {takeaway3}. Next steps involve {nextstep1} and {nextstep2}."
    ]
};

// Replacement values
const replacements = {
    technology: ['Python', 'JavaScript', 'Rust', 'Go', 'Java', 'C++', 'TypeScript', 'Swift', 'Kotlin', 'Scala'],
    aspect: ['performance', 'scalability', 'maintainability', 'security', 'usability', 'reliability', 'efficiency', 'flexibility'],
    factor1: ['code quality', 'testing', 'documentation', 'monitoring', 'logging', 'error handling', 'caching', 'optimization'],
    factor2: ['user experience', 'system architecture', 'data modeling', 'API design', 'deployment', 'maintenance', 'scaling', 'integration'],
    factor3: ['team collaboration', 'project management', 'version control', 'continuous integration', 'code review', 'performance tuning', 'security audit', 'user feedback'],
    practice: ['agile development', 'test-driven development', 'continuous integration', 'code review', 'pair programming', 'documentation first', 'user-centered design', 'performance monitoring'],
    focus: ['user experience', 'system performance', 'code quality', 'security', 'scalability', 'maintainability', 'reliability', 'efficiency'],
    involvement1: ['planning', 'design', 'implementation', 'testing', 'deployment', 'monitoring', 'maintenance', 'optimization'],
    involvement2: ['collaboration', 'communication', 'documentation', 'review', 'iteration', 'improvement', 'learning', 'adaptation'],
    involvement3: ['evaluation', 'feedback', 'refinement', 'enhancement', 'expansion', 'integration', 'automation', 'innovation'],
    result: ['improved performance', 'better user experience', 'increased efficiency', 'enhanced security', 'greater scalability', 'reduced complexity', 'higher quality', 'better maintainability'],
    system: ['microservices', 'monolith', 'distributed system', 'cloud-native', 'serverless', 'containerized', 'event-driven', 'reactive'],
    principle: ['modularity', 'scalability', 'reliability', 'maintainability', 'security', 'performance', 'flexibility', 'simplicity'],
    capability1: ['horizontal scaling', 'fault tolerance', 'high availability', 'load balancing', 'auto-scaling', 'disaster recovery', 'backup', 'monitoring'],
    capability2: ['real-time processing', 'batch processing', 'stream processing', 'data analytics', 'machine learning', 'artificial intelligence', 'automation', 'optimization'],
    capability3: ['integration', 'interoperability', 'compatibility', 'portability', 'extensibility', 'customization', 'configuration', 'adaptation'],
    optimization: ['caching', 'indexing', 'compression', 'parallel processing', 'load balancing', 'resource pooling', 'connection pooling', 'query optimization'],
    project: ['AI Platform', 'Data Analytics', 'Customer Portal', 'Mobile App', 'Web Service', 'API Gateway', 'Dashboard', 'Reporting System'],
    goal: ['improve efficiency', 'enhance user experience', 'reduce costs', 'increase revenue', 'streamline processes', 'automate workflows', 'optimize performance', 'scale operations'],
    stakeholder1: ['developers', 'designers', 'product managers', 'business analysts', 'quality assurance', 'devops engineers', 'data scientists', 'user researchers'],
    stakeholder2: ['customers', 'users', 'partners', 'vendors', 'suppliers', 'contractors', 'consultants', 'advisors'],
    stakeholder3: ['executives', 'directors', 'managers', 'team leads', 'architects', 'specialists', 'experts', 'mentors'],
    metric1: ['user satisfaction', 'performance metrics', 'conversion rates', 'engagement levels', 'retention rates', 'churn rates', 'revenue growth', 'cost reduction'],
    metric2: ['quality scores', 'defect rates', 'delivery times', 'response times', 'uptime', 'availability', 'scalability', 'reliability'],
    metric3: ['team productivity', 'code quality', 'test coverage', 'deployment frequency', 'lead time', 'mean time to recovery', 'change failure rate', 'customer feedback'],
    initiative: ['digital transformation', 'cloud migration', 'automation', 'AI integration', 'data modernization', 'process improvement', 'customer experience', 'operational excellence'],
    outcome1: ['increased efficiency', 'better user experience', 'reduced costs', 'improved quality', 'faster delivery', 'higher satisfaction', 'greater agility', 'enhanced security'],
    outcome2: ['streamlined processes', 'automated workflows', 'optimized performance', 'scaled operations', 'enhanced capabilities', 'improved outcomes', 'better results', 'greater success'],
    department: ['Engineering', 'Product', 'Marketing', 'Sales', 'Customer Success', 'Operations', 'Finance', 'Human Resources'],
    trend: ['growth', 'improvement', 'optimization', 'expansion', 'innovation', 'transformation', 'evolution', 'advancement'],
    achievement1: ['increased productivity', 'improved quality', 'reduced costs', 'enhanced performance', 'better outcomes', 'higher satisfaction', 'greater efficiency', 'improved results'],
    achievement2: ['successful delivery', 'exceeded targets', 'met objectives', 'achieved goals', 'completed milestones', 'delivered value', 'created impact', 'drove success'],
    achievement3: ['team collaboration', 'process improvement', 'innovation', 'optimization', 'transformation', 'growth', 'advancement', 'excellence'],
    improvement1: ['process optimization', 'efficiency enhancement', 'quality improvement', 'performance tuning', 'cost reduction', 'time management', 'resource utilization', 'workflow automation'],
    improvement2: ['team development', 'skill enhancement', 'knowledge sharing', 'collaboration improvement', 'communication optimization', 'training programs', 'mentorship', 'professional growth'],
    task: ['code review', 'bug fixing', 'feature development', 'testing', 'documentation', 'deployment', 'monitoring', 'optimization'],
    involvement: ['planning', 'design', 'implementation', 'testing', 'review', 'iteration', 'improvement', 'maintenance'],
    challenge1: ['technical complexity', 'time constraints', 'resource limitations', 'scope changes', 'integration issues', 'performance problems', 'security concerns', 'compatibility issues'],
    challenge2: ['team coordination', 'communication gaps', 'knowledge sharing', 'skill gaps', 'workload management', 'priority conflicts', 'stakeholder alignment', 'expectation management'],
    challenge3: ['technical debt', 'legacy systems', 'scalability issues', 'maintenance overhead', 'documentation gaps', 'testing coverage', 'deployment complexity', 'monitoring gaps'],
    learning: ['new technologies', 'best practices', 'problem-solving techniques', 'collaboration skills', 'communication strategies', 'project management', 'technical skills', 'soft skills'],
    goal1: ['complete tasks', 'meet deadlines', 'achieve objectives', 'deliver results', 'exceed expectations', 'drive success', 'create value', 'make impact'],
    goal2: ['improve skills', 'learn new things', 'grow professionally', 'develop expertise', 'enhance capabilities', 'build knowledge', 'gain experience', 'advance career'],
    goal3: ['collaborate effectively', 'communicate clearly', 'work efficiently', 'deliver quality', 'solve problems', 'innovate solutions', 'optimize processes', 'drive improvement'],
    method1: ['focused effort', 'systematic approach', 'structured planning', 'organized execution', 'disciplined work', 'consistent progress', 'regular review', 'continuous improvement'],
    method2: ['collaboration', 'communication', 'coordination', 'cooperation', 'teamwork', 'partnership', 'alliance', 'synergy'],
    method3: ['learning', 'research', 'experimentation', 'exploration', 'discovery', 'innovation', 'creativity', 'adaptation'],
    outcome: ['success', 'achievement', 'accomplishment', 'progress', 'improvement', 'growth', 'development', 'advancement'],
    event: ['meeting', 'conference', 'workshop', 'seminar', 'training', 'presentation', 'discussion', 'review'],
    topic: ['project updates', 'technical challenges', 'process improvements', 'team collaboration', 'performance metrics', 'strategic planning', 'innovation', 'best practices'],
    takeaway1: ['key insights', 'important learnings', 'valuable information', 'useful knowledge', 'practical skills', 'best practices', 'expertise', 'wisdom'],
    takeaway2: ['action items', 'next steps', 'follow-up tasks', 'implementation plans', 'strategic initiatives', 'operational improvements', 'development opportunities', 'growth areas'],
    takeaway3: ['connections', 'relationships', 'networking', 'collaboration', 'partnerships', 'alliances', 'synergies', 'opportunities'],
    nextstep1: ['implementation', 'execution', 'delivery', 'completion', 'achievement', 'success', 'progress', 'advancement'],
    nextstep2: ['follow-up', 'review', 'evaluation', 'assessment', 'analysis', 'reflection', 'improvement', 'optimization']
};

function generateContent(template, count) {
    const results = [];
    
    for (let i = 0; i < count; i++) {
        let content = template;
        
        // Replace placeholders with random values
        Object.keys(replacements).forEach(key => {
            const values = replacements[key];
            const randomValue = values[Math.floor(Math.random() * values.length)];
            content = content.replace(new RegExp(`{${key}}`, 'g'), randomValue);
        });
        
        results.push(content);
    }
    
    return results;
}

function generateTestData(count = 100) {
    const testData = [];
    const types = ['document', 'task', 'event'];
    const categories = Object.keys(contentTemplates);
    
    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const template = contentTemplates[category][Math.floor(Math.random() * contentTemplates[category].length)];
        const content = generateContent(template, 1)[0];
        
        testData.push({
            id: i + 1,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
            content: content,
            type: types[Math.floor(Math.random() * types.length)],
            category: category
        });
    }
    
    return testData;
}

function saveTestData(data, filename = 'test-data.json') {
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ Generated ${data.length} test documents`);
    console.log(`📁 Saved to: ${filepath}`);
}

function generateSearchQueries(count = 20) {
    const queries = [
        'artificial intelligence and machine learning',
        'project management and team collaboration',
        'software development and programming',
        'data analysis and optimization',
        'user experience and design',
        'performance and scalability',
        'security and best practices',
        'testing and quality assurance',
        'deployment and operations',
        'monitoring and maintenance',
        'code review and documentation',
        'agile development and methodology',
        'cloud computing and infrastructure',
        'database design and optimization',
        'API development and integration',
        'mobile app development',
        'web application architecture',
        'devops and continuous integration',
        'business strategy and planning',
        'customer experience and satisfaction'
    ];
    
    return queries.slice(0, count);
}

// Main execution
if (require.main === module) {
    const count = process.argv[2] ? parseInt(process.argv[2]) : 100;
    
    console.log(`🚀 Generating ${count} test documents...`);
    
    const testData = generateTestData(count);
    const searchQueries = generateSearchQueries(20);
    
    saveTestData(testData, 'test-data.json');
    saveTestData(searchQueries, 'search-queries.json');
    
    console.log('\n📊 Generated data summary:');
    console.log(`- Documents: ${testData.length}`);
    console.log(`- Search queries: ${searchQueries.length}`);
    console.log(`- Types: ${[...new Set(testData.map(d => d.type))].join(', ')}`);
    console.log(`- Categories: ${[...new Set(testData.map(d => d.category))].join(', ')}`);
    
    console.log('\n🎯 Usage:');
    console.log('1. Use test-data.json to index content in the Vector Test Page');
    console.log('2. Use search-queries.json to test semantic search');
    console.log('3. Test with different thresholds and limits');
    console.log('4. Monitor performance and accuracy');
}

module.exports = {
    generateTestData,
    generateSearchQueries,
    generateContent,
    replacements,
    contentTemplates
};


