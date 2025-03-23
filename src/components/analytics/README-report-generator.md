# PowerPoint Report Generator

## Overview

The Report Generator feature allows users to create customized property analysis reports with a scoring system. It provides a user-friendly interface for configuring scoring criteria, selecting report content, and generating professional PowerPoint presentations.

## Features

### 1. Interactive Scoring System

- **Customizable Scoring Categories**: The scoring system is organized into categories such as Location, Planning Controls, Property Characteristics, Market Conditions, and Risk Assessment.
- **Weighted Criteria**: Each category and individual criterion can be assigned custom weights to reflect their importance in the overall analysis.
- **Enable/Disable Components**: Users can toggle individual criteria or entire categories to customize the scoring model for specific property types or analysis needs.

### 2. Content Selection

- **Modular Report Sections**: Users can choose which sections to include in the final report, such as Property Overview, Planning Controls, Site Analysis, etc.
- **Content Restrictions**: Clearly indicates which data sources cannot be included in reports (flood maps, geoscape data, UDPL information, GPR analysis, and utility infrastructure).

### 3. PowerPoint Generation

- **Professional Templates**: Generates well-formatted PowerPoint slides with consistent styling.
- **Data Visualization**: Includes tables, maps, and score indicators with color-coding based on performance.
- **Score Summaries**: Creates detailed scoring breakdowns both at the category and criteria levels.

### 4. Template Management

- **Save Custom Templates**: Users can save their scoring configurations for future use.
- **Reuse Templates**: Saved templates can be loaded and applied to different properties.

## Technical Information

### Dependencies

- **PptxGenJS**: Used for PowerPoint file generation
- **HTML2Canvas**: For capturing map screenshots
- **Supabase**: For storing user templates
- **ShadCn UI**: For UI components

### Data Flow

1. User selects a property in the map interface
2. Property data is loaded from various sources
3. User configures scoring criteria and selects report content
4. Scores are calculated based on property data and user weights
5. PowerPoint presentation is generated with selected content and scoring analysis

### Database Schema

The scoring templates are stored in the `scoring_templates` table with the following structure:

- `id`: UUID (primary key)
- `name`: Text (template name)
- `categories`: JSONB (scoring configuration)
- `user_id`: UUID (foreign key to users table)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `overall_score`: Integer (optional)

## Usage Guidelines

### Best Practices

- **Customize for Property Type**: Different property types may require different scoring models. For example, residential vs commercial properties.
- **Validate Results**: Always review the generated scores to ensure they match expectations before sharing reports.
- **Include Context**: When sharing reports, provide context about the scoring methodology to help recipients understand the analysis.

### Limitations

- Certain restricted data types cannot be included in exported reports due to licensing restrictions.
- Scores are indicative and should be used as a guide rather than a definitive evaluation.
- The system uses available data for the property; missing data may affect score completeness.

## Future Enhancements

- Addition of score comparison between multiple properties
- Enhanced data visualization with charts and graphs
- Machine learning-based scoring suggestions
- Additional export formats beyond PowerPoint
