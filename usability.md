# LurkForWork Website Usability

## Overall Interface Design and Interaction

LurkForWork provides a professional social platform with a user interface that follows modern web design standards, primarily featuring these pages:

- Login/Registration page
- Homepage Feed
- Profile page
- Profile editing page

The overall design employs the Bootstrap framework, with consistent interface styling and clean color coordination using blue as the primary color, which aligns with the professional social platform positioning.

## Attempts to make it more usable/accessible

### 1. Simple and Intuitive Navigation

- Fixed top navigation bar provides quick access to the homepage
- Clear login/registration links allow users to easily switch between interfaces
- Profile access entry is clearly defined, accessible by clicking the username shown as [Logged In As: ...] on the nav bar
- Home page link is always on the nav bar, ensuring users never get stuck in a dead end

### 2. Accessibility Features
- Perceivability: All images include appropriate alt text for screen reader compatibility
- Semantic HTML elements used throughout the application (headers, sections, nav)
- Form elements properly labeled with associated text
- Sufficient color contrast ratios between text and backgrounds
- Muted and Italic text to alert user, like "No comments yet"
- Semantic HTML elements used throughout the application (headers, sections, nav)
- Form elements properly labeled with associated text

### 3. Good UI/UX Design
- UI design is consistent in color use, button and modal style
- Added emoji to make the page more vivid and easier to understand
- Added shadow to post to enhance contrast with background
- Added loading spinner at the bottom of the page during content fetching
- Use one consistent sans-serif font throughout to enhance readability
- Bolding used to highlight title
### 4. Good Feedback Mechanisms

- Clear success prompts after operations (such as "Saved", "Posted" status)
- Error messages displayed as modal dialogs without interrupting user workflow
- Loading states have clear visual indicators (loading animations)
- Real-time update of like and comments

### 5. Responsive Design

- Adapts to different screen sizes, displaying well on both mobile devices and desktop environments
- Content area width is reasonable, providing a good reading experience
