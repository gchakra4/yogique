import { supabase } from '../shared/lib/supabase';
const sampleNewsletters = [
    {
        title: 'Welcome to Our Newsletter',
        subject: 'Welcome! Your journey begins here 🎉',
        content: `<p>Welcome to our community! We're thrilled to have you join us on this exciting journey.</p>
    
    <p>In this newsletter, you'll discover:</p>
    <ul>
      <li>🧘‍♀️ Weekly yoga tips and poses</li>
      <li>🍃 Wellness insights and mindfulness practices</li>
      <li>📅 Upcoming classes and events</li>
      <li>🏆 Success stories from our community</li>
    </ul>
    
    <p>Stay tuned for amazing content that will help you on your wellness journey!</p>
    
    <p>Namaste,<br>The Yogique Team</p>`,
        template: 'modern-gradient',
        status: 'draft'
    },
    {
        title: 'Weekly Yoga Practice Guide',
        subject: 'Your Weekly Yoga Practice - 5 Essential Poses',
        content: `<p>This week, let's focus on building strength and flexibility with these 5 essential yoga poses:</p>
    
    <h3>🌟 Featured Poses This Week</h3>
    <ol>
      <li><strong>Mountain Pose (Tadasana)</strong> - Foundation for all standing poses</li>
      <li><strong>Downward Dog (Adho Mukha Svanasana)</strong> - Full body stretch and strength</li>
      <li><strong>Warrior I (Virabhadrasana I)</strong> - Build leg strength and open hips</li>
      <li><strong>Tree Pose (Vrikshasana)</strong> - Improve balance and focus</li>
      <li><strong>Child's Pose (Balasana)</strong> - Rest and restore</li>
    </ol>
    
    <p>💡 <strong>Tip:</strong> Hold each pose for 5-8 breaths and remember to listen to your body.</p>
    
    <p>Join us for live sessions every Monday, Wednesday, and Friday at 7 AM and 7 PM.</p>
    
    <p>Happy practicing!<br>Your Yoga Instructors</p>`,
        template: 'minimal-clean',
        status: 'draft'
    },
    {
        title: 'Monthly Wellness Update',
        subject: 'March Wellness Update - New Classes & Community Highlights',
        content: `<p>Dear Wellness Warriors,</p>
    
    <p>March has been an incredible month for our community! Here are the highlights:</p>
    
    <h3>🆕 New Class Offerings</h3>
    <ul>
      <li>Prenatal Yoga - Tuesdays 10 AM</li>
      <li>Advanced Vinyasa - Thursdays 8 PM</li>
      <li>Meditation & Mindfulness - Saturdays 9 AM</li>
    </ul>
    
    <h3>🏆 Community Achievements</h3>
    <ul>
      <li>500+ members joined our community this month!</li>
      <li>Over 1,000 classes attended</li>
      <li>15 new certified instructors</li>
    </ul>
    
    <h3>📅 Upcoming Events</h3>
    <ul>
      <li>Spring Yoga Retreat - April 15-17</li>
      <li>International Yoga Day Celebration - June 21</li>
      <li>Instructor Training Program - Starting May 1</li>
    </ul>
    
    <p>Thank you for being part of our amazing community!</p>
    
    <p>With gratitude,<br>The Yogique Team</p>`,
        template: 'newsletter-magazine',
        status: 'sent'
    }
];
export async function createSampleNewsletters() {
    try {
        console.log('Creating sample newsletters...');
        // Check if newsletters already exist
        const { data: existing } = await supabase
            .from('newsletters')
            .select('id')
            .limit(1);
        if (existing && existing.length > 0) {
            console.log('Sample newsletters already exist, skipping creation');
            return { success: true, message: 'Sample newsletters already exist' };
        }
        // Insert sample newsletters
        const newslettersToInsert = sampleNewsletters.map(newsletter => ({
            ...newsletter,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sent_at: newsletter.status === 'sent' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null
        }));
        const { data, error } = await supabase
            .from('newsletters')
            .insert(newslettersToInsert)
            .select();
        if (error) {
            console.error('Error creating sample newsletters:', error);
            return { success: false, error: error.message };
        }
        console.log('Sample newsletters created successfully:', data);
        return { success: true, data, message: `Created ${sampleNewsletters.length} sample newsletters` };
    }
    catch (error) {
        console.error('Error in createSampleNewsletters:', error);
        return { success: false, error: error.message };
    }
}
export async function clearAllNewsletters() {
    try {
        console.log('Clearing all newsletters...');
        const { error } = await supabase
            .from('newsletters')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        if (error) {
            console.error('Error clearing newsletters:', error);
            return { success: false, error: error.message };
        }
        console.log('All newsletters cleared successfully');
        return { success: true, message: 'All newsletters cleared' };
    }
    catch (error) {
        console.error('Error in clearAllNewsletters:', error);
        return { success: false, error: error.message };
    }
}

