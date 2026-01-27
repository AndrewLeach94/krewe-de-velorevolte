import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const email = body.email;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email address',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get Mailjet credentials from environment variables
    const apiKey = import.meta.env.MAILJET_API_KEY;
    const secretKey = import.meta.env.MAILJET_SECRET_KEY;
    const listId = import.meta.env.MAILJET_CONTACT_LIST_ID;

    if (!apiKey || !secretKey || !listId) {
      console.error('Missing Mailjet credentials in environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error. Please try again later.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create Basic Auth header
    const credentials = btoa(`${apiKey}:${secretKey}`);
    const authHeader = `Basic ${credentials}`;

    // Step 1: Create/get contact in Mailjet
    const contactResponse = await fetch('https://api.mailjet.com/v3/REST/contact', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Email: email,
        IsExcludedFromCampaigns: false,
      }),
    });

    let contactData;
    
    if (contactResponse.ok) {
      contactData = await contactResponse.json();
    } else if (contactResponse.status === 400) {
      // Contact might already exist, try to get it
      const getContactResponse = await fetch(`https://api.mailjet.com/v3/REST/contact/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (getContactResponse.ok) {
        contactData = await getContactResponse.json();
      } else {
        const errorData = await contactResponse.json().catch(() => ({}));
        console.error('Mailjet contact creation error:', errorData);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to process subscription. Please try again later.',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } else {
      const errorData = await contactResponse.json().catch(() => ({}));
      console.error('Mailjet contact creation error:', errorData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to process subscription. Please try again later.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Step 2: Add contact to the mailing list
    const addToListResponse = await fetch(
      `https://api.mailjet.com/v3/REST/contactslist/${listId}/managecontact`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: email,
          Action: 'addnoforce',
        }),
      }
    );

    if (!addToListResponse.ok) {
      const errorData = await addToListResponse.json().catch(() => ({}));
      
      // Check if contact is already in the list (this is not really an error)
      if (errorData.StatusCode === 400 && errorData.ErrorMessage?.includes('already')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'You are already subscribed to our newsletter!',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.error('Mailjet add to list error:', errorData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to complete subscription. Please try again later.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully subscribed to newsletter!',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
