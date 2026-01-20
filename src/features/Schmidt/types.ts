export type SchmidtOpsState =
    | 'idle'
    | 'selecting_skill'
    | 'flash_deal_init_method'
    | 'flash_deal_input'
    | 'event_input'         // Initial "Paste everything" state
    | 'event_input_title'   // Interview Mode: Asking for Title
    | 'event_input_date'    // Interview Mode: Asking for Date
    | 'event_input_time'    // Interview Mode: Asking for Time
    | 'event_input_type'    // Interview Mode: Asking for Type (Trivia, Karaoke, etc.)
    | 'event_input_prizes'
    | 'event_input_details' // Interview Mode: Asking for Description/Prizes
    | 'event_init_check_flyer'
    | 'event_init_check_gen'
    | 'event_upload_wait'
    | 'generating_creative_copy'
    | 'review_event_copy'
    | 'social_post_input'
    | 'email_draft_input'
    | 'calendar_post_input'
    | 'website_content_input'
    | 'image_gen_purpose'
    | 'image_gen_goal'
    | 'image_gen_event'
    | 'image_gen_audience'
    | 'image_gen_specials'
    | 'image_gen_context'
    | 'post_image_gen'
    | 'confirm_action'
    | 'completed';
