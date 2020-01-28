import Cookie from 'js-cookie';
import { SiteUtilities } from '../utils';

let fchatSignupForm = (className, form) => {
  const $form = $(form);
  const signUpApiUrl = $(form).data('signup-url') || 'https://web.freshchat.com/app/v1/signup/unity_signup?noredirect=true';
  let email = $form.find('input[name^="email"]').val();
  const emailHash = SiteUtilities.getShaHash(email);
  let geoLocation = session.simpleGeoLocation;
  let errorWrapper = $form.find('.error-wrapper');
  const firstName = $form.find('.first-name-form').val() || '';
  const lastName = $form.find('.last-name-form').val() || '';
  const phoneNumber = $form.find('.phone-form').val() || '';
  const companyName = $form.find('.company-form').val() || '';
  const isExternalIframeSignup = $form.parents('.external-iframe-signup').length;
  const currentReferrer = SiteUtilities.getCurrentReferrer();
  $form.find('.button').addClass('button--loading').attr('disabled', 'disabled');
  session.location = session.simpleGeoLocation;
  let fsCookie = '';
  const currencyUnit = getFchatCurrencyUnit(session.simpleGeoLocation.countryName, session.simpleGeoLocation.countryCode);
  try {
    fsCookie = freshsales.anonymous_id;
  } catch (exception) {
    SiteUtilities.log(
      'Freshchat fsales anonymous id  exception.',
      'submitHandlers.fchatForm',
      2,
      exception
    );
  }

  //  $(form).find('#landing_url').val(window.location.href);
  // $(form).find('#session_json').val(JSON.stringify(session));
  let fsalesId = typeof freshsales !== 'undefined' ? freshsales.anonymous_id : 'Error - freshsales is not defined';
  let data = {
    'user_first_name': firstName,
    'user_last_name': lastName,
    'user_phone': phoneNumber,
    'user_company': companyName,
    'user_name': firstName + ' ' + lastName,
    'email': email,
    'gdpr_first_opt_in': ($form.find('input[name="send_promotions"]').is(':checked')),
    'country': geoLocation.countryName,
    'region_name': session.location.regionName,
    'zip_code': session.location.zipCode,
    'session_json': JSON.stringify(session),
    'first_referrer': (isExternalIframeSignup && currentReferrer) ? currentReferrer : (Cookie.get('fw_fr') || window.location.href),
    'first_landing_url': Cookie.get('fw_flu') || '',
    'freshsales_id': fsalesId,
    'fs_cookie': fsCookie,
    'currency': currencyUnit
  };
  let plan = $form.find('input[name="plan-id"]').val();
  if (plan !== undefined && plan !== '') {
    data['plan'] = plan;
  }

  $.ajax({
    url: signUpApiUrl,
    type: 'POST',
    data: $.param(data),
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      if (response.success === true) {
        fchatSignupFormSuccess($form, response);
      } else if (response.success === false) {
        errorWrapper.addClass('error');
        $form.find('.button').removeClass('button--loading').removeAttr('disabled');
        window.location.href = response.redirectUri + `?ehash=${emailHash}`;
      }
    },
    error: (xhr, status, err) => {
      $form.find('.button').removeClass('button--loading').removeAttr('disabled');
      errorWrapper.addClass('error');
      errorWrapper.html('Service unavailable');
      SiteUtilities.log(
        'Internal Server error',
        'submitHandlers.fchatSignupForm',
        2,
        err
      );
    },
    complete: () => {
      $form.find('.button').removeClass('button--loading').attr('disabled', null);
    }
  });
};

const fchatSignupFormSuccess = ($form, response, alohaV2 = false) => {
  const redirect = $form.attr('data-redirect');
  const isExternalIframeSignup = $form.parents('.external-iframe-signup').length;
  const email = $form.find('input[name^="email"]').val();
  const emailHash = SiteUtilities.getShaHash(email);
  const errorWrapper = $form.find('.error-wrapper');
  let accountId;

  if (alohaV2) {
    const signupResponse = response['product_signup_response'];
    const redirectUrl = signupResponse['redirect_url'].replace(/\/$/, '');
    accountId = signupResponse.account.id;
    localStorage.setItem('redirect_url', redirectUrl);
  } else {
    accountId = response.defaultApp;
  }

  // Freshmarketer Data. We are passing email, contactable. Other fields will be sent by the product endpoint.
  const freshmarketerData = {
    'freshmarketerObject': {
      'email': email,
      'contactable': ($form.find('input[name="send_promotions"]').is(':checked'))
    }
  };

  // Redirect to thank-you page once Freshmarketer Post is complete.
  jQuery.when(
    SiteUtilities.freshmarketerPost(freshmarketerData, false, $form.get[0])
  ).then(function () {
    errorWrapper.removeClass('error');
    let thankYouRedirect = `${redirect}/?account_id=${accountId}&ehash=${emailHash}`;
    if (isExternalIframeSignup) {
      thankYouRedirect = thankYouRedirect + '&post_to_partner=true';
    }
    window.location.href = thankYouRedirect;
  });
};

const getFchatCurrencyUnit = (countryName, countryCode) => {
  // Currency selection handler
  const countryEU = [
    'Austria',
    'Belgium',
    'Cyprus',
    'Estonia',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Ireland',
    'Italy',
    'Latvia',
    'Luxembourg',
    'Malta',
    'Netherlands',
    'Portugal',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Andorra',
    'Kosovo',
    'Montenegro',
    'Monaco',
    'San Marino',
    'The Vatican City'
  ];
  const currencyMap = {
    'IN': 'inr',
    'US': 'usd',
    'EU': 'eur',
    'GB': 'gbp',
    'AU': 'aud'
  };
  let countrySelected = null;
  if (countryEU.indexOf(countryName) >= 0) {
    countrySelected = 'EU';
  } else if (currencyMap.hasOwnProperty(countryCode)) {
    countrySelected = countryCode;
  } else {
    countrySelected = 'US';
  }
  return currencyMap[countrySelected];
};

let fchatDemoRequestForm = (classname, form) => {
  const $form = $(form);
  let chatUsage = '';
  const checkboxes = $form.find('input[type="checkbox"]');
  const geoLocation = session.simpleGeoLocation;
  $(checkboxes).each((index, element) => {
    if (element.checked) {
      chatUsage += $(element).parents('label.checkbox-control').text().trim() + ',';
    }
  });
  chatUsage = chatUsage.replace(/,\s*$/, '');
  const firstName = $form.find('input[name^="first-name"]').val();
  const lastName = $form.find('input[name^="last-name"]').val();
  const emailid = $form.find('input[name^="email"]').val();
  const phone = $form.find('input[name^="phone"]').val() || '';
  const companyName = $form.find('input[name^="company"]').val();
  const teamMembers = $form.find('input[name^="agents"]').val();
  const currentChatProduct = $form.find('select[name^="query"]').val();
  const emailHash = SiteUtilities.getShaHash(emailid);

  // Freshmarketer Data
  const freshmarketerData = {
    'freshmarketerObject': {
      'first_name': firstName,
      'last_name': lastName,
      'email': emailid,
      'company': companyName,
      'phone': phone,
      'country': geoLocation.countryName,
      'contactable': ($form.find('input[name="send_promotions"]').is(':checked')),
      'custom_field': {
        'cf_fchatagentcount': teamMembers,
        'cf_fchatcurrentchatproduct': currentChatProduct,
        'cf_fchatusage': chatUsage,
        'cf_freshmarketer_list': $form.find('.fm-list-id').val()
      }
    }
  };

  const freshsalesDeferred = $.Deferred();
  const newLead = {
    'First name': firstName,
    'Last name': lastName,
    'Email': emailid,
    'Work': phone || 'Not filled',
    'Country': geoLocation.countryName,
    'Source': 'Inbound',
    'Campaign': 'Demo Request',
    'Sales Campaign': 'Freshchat - Demo',
    'Product': 'Freshchat',
    'Signup Referrer': Cookie.get('fw_flu') || '',
    'First Referrer': Cookie.get('fw_fr') || '',
    'Team Members': teamMembers,
    'Current Chat Product': currentChatProduct,
    'Freshchat Usage': chatUsage,
    'fs_update': false,
    'Company': {
      'Name': companyName
    }
  };

  $form.find('.button').addClass('button--loading').attr('disabled', 'disabled');
  freshsales.identify(emailid, newLead, function () {
    freshsalesDeferred.resolve();
  });

  setTimeout(function () {
    jQuery.when(
      freshsalesDeferred,
      SiteUtilities.freshmarketerPost(freshmarketerData, false, form)
    ).then(function () {
      window.location.href = $form.attr('data-redirect') + `/?ehash=${emailHash}`;
    });
  }, 300);
};

// let fchatWhatsAppOnBoardingForm = (classname, form) => {
//   const $form = $(form);
//   let chatUsage = '';
//   const checkboxes = $form.find('input[type="checkbox"]');
//   const geoLocation = session.simpleGeoLocation;
//   $(checkboxes).each((index, element) => {
//     if (element.checked) {
//       chatUsage += $(element).parents('label.checkbox-control').text().trim() + ',';
//     }
//   });
//   chatUsage = chatUsage.replace(/,\s*$/, '');
//   const firstName = $form.find('input[name^="first-name"]').val();
//   const lastName = $form.find('input[name^="last-name"]').val();
//   const emailid = $form.find('input[name^="email"]').val();
//   const phone = $form.find('input[name^="phone"]').val() || '';
//   const emailHash = SiteUtilities.getShaHash(emailid);
//
//   // Freshmarketer Data
//   const freshmarketerData = {
//     'freshmarketerObject': {
//       'first_name': firstName,
//       'last_name': lastName,
//       'email': emailid,
//       'phone': phone,
//       'country': geoLocation.countryName,
//       'contactable': ($form.find('input[name="send_promotions"]').is(':checked')),
//       'custom_field': {
//         'cf_fchatusage': chatUsage,
//         'cf_freshmarketer_list': $form.find('.fm-list-id').val()
//       }
//     }
//   };
//
//   const freshsalesDeferred = $.Deferred();
//   const newLead = {
//     'First name': firstName,
//     'Last name': lastName,
//     'Email': emailid,
//     'Work': phone || 'Not filled',
//     'Country': geoLocation.countryName,
//     'Source': 'Inbound',
//     'Campaign': 'Demo Request',
//     'Sales Campaign': 'Freshchat - Demo',
//     'Product': 'Freshchat',
//     'Signup Referrer': Cookie.get('fw_flu') || '',
//     'First Referrer': Cookie.get('fw_fr') || '',
//     'Freshchat Usage': chatUsage,
//     'fs_update': false
//   };
//
//   $form.find('.button').addClass('button--loading').attr('disabled', 'disabled');
//   freshsales.identify(emailid, newLead, function () {
//     freshsalesDeferred.resolve();
//   });
//
//   setTimeout(function () {
//     jQuery.when(
//       freshsalesDeferred,
//       SiteUtilities.freshmarketerPost(freshmarketerData, false, form)
//     ).then(function () {
//       window.location.href = $form.attr('data-redirect') + `/?ehash=${emailHash}`;
//     });
//   }, 300);
//
//   $.ajax({
//     url: signUpApiUrl,
//     type: 'POST',
//     data: $.param(data),
//     contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
//     dataType: 'json',
//     xhrFields: {
//       withCredentials: true
//     },
//     success: (response) => {
//       if (response.success === true) {
//         fchatSignupFormSuccess($form, response);
//       } else if (response.success === false) {
//         errorWrapper.addClass('error');
//         $form.find('.button').removeClass('button--loading').removeAttr('disabled');
//         window.location.href = response.redirectUri + `?ehash=${emailHash}`;
//       }
//     },
//     error: (xhr, status, err) => {
//       $form.find('.button').removeClass('button--loading').removeAttr('disabled');
//       errorWrapper.addClass('error');
//       errorWrapper.html('Service unavailable');
//       SiteUtilities.log(
//         'Internal Server error',
//         'submitHandlers.fchatSignupForm',
//         2,
//         err
//       );
//     },
//     complete: () => {
//       $form.find('.button').removeClass('button--loading').attr('disabled', null);
//     }
//   });
// };

let fchatWhatsAppOnBoardingForm = (className, form) => {
  const $form = $(form);
  let chatUsage = '';
  const checkboxes = $form.find('input[type="checkbox"]');
  const geoLocation = session.simpleGeoLocation;
  $(checkboxes).each((index, element) => {
    if (element.checked) {
      chatUsage += $(element).parents('label.checkbox-control').text().trim() + ',';
    }
  });
  chatUsage = chatUsage.replace(/,\s*$/, '');
  const signUpApiUrl = 'https://web.freshchat.com/app/v1/signup/unity_signup?noredirect=true';
  let email = $form.find('input[name^="email"]').val();
  Cookie.set('fc_email_id', email);
  const emailHash = SiteUtilities.getShaHash(email);
  let errorWrapper = $form.find('.error-wrapper');
  const firstName = $form.find('.first-name-form').val() || '';
  Cookie.set('fc_first_name', firstName);
  const lastName = $form.find('.last-name-form').val() || '';
  Cookie.set('fc_last_name', lastName);
  const phoneNumber = $form.find('.phone-form').val() || '';
  Cookie.set('fc_phone_number', phoneNumber);
  const companyName = $form.find('.company-form').val() || '';
  const teamMembers = $form.find('input[name^="agents"]').val();
  const isExternalIframeSignup = $form.parents('.external-iframe-signup').length;
  const currentReferrer = SiteUtilities.getCurrentReferrer();
  const currentChatProduct = $form.find('select[name^="query"]').val();
  const redirect = $form.attr('data-redirect');
  $form.find('.button').addClass('button--loading').attr('disabled', 'disabled');
  session.location = session.simpleGeoLocation;
  let fsCookie = '';
  const currencyUnit = getFchatCurrencyUnit(session.simpleGeoLocation.countryName, session.simpleGeoLocation.countryCode);
    let thankYouRedirect = `${redirect}/?ehash=${emailHash}`;
    if (isExternalIframeSignup) {
      thankYouRedirect = thankYouRedirect + '&post_to_partner=true';
    }
    window.location.href = thankYouRedirect;
};

let fchatWhatsAppOnBoardingForm2 = (className, form) => {
  const $form = $(form);
  let chatUsage = '';
  const checkboxes = $form.find('input[type="checkbox"]');
  const geoLocation = session.simpleGeoLocation;
  $(checkboxes).each((index, element) => {
    if (element.checked) {
      chatUsage += $(element).parents('label.checkbox-control').text().trim() + ',';
    }
  });
  let signupEnabled = checkboxes[0].checked;
  console.log(signupEnabled);
  chatUsage = chatUsage.replace(/,\s*$/, '');
  const signUpApiUrl = 'https://web.freshchat.com/app/v1/signup/unity_signup?noredirect=true';
  let email = $form.find('input[name^="email"]').val();
  const emailHash = SiteUtilities.getShaHash(email);
  let errorWrapper = $form.find('.error-wrapper');
  const firstName = $form.find('.first-name-form').val() || '';
  const lastName = $form.find('.last-name-form').val() || '';
  const phoneNumber = $form.find('.phone-form').val() || '';
  const companyName = $form.find('.company-form').val() || '';
  const teamMembers = $form.find('input[name^="agents"]').val();
  const isExternalIframeSignup = $form.parents('.external-iframe-signup').length;
  const currentReferrer = SiteUtilities.getCurrentReferrer();
  // const currentChatProduct = $form.find('select[name^="query"]').val();
  const redirect = $form.attr('data-redirect');
  $form.find('.button').addClass('button--loading').attr('disabled', 'disabled');
  session.location = session.simpleGeoLocation;
  let fsCookie = '';
  const currencyUnit = getFchatCurrencyUnit(session.simpleGeoLocation.countryName, session.simpleGeoLocation.countryCode);

  try {
    fsCookie = freshsales.anonymous_id;
  } catch (exception) {
    SiteUtilities.log(
      'Freshchat fsales anonymous id  exception.',
      'submitHandlers.fchatForm',
      2,
      exception
    );
  }

  //  $(form).find('#landing_url').val(window.location.href);
  // $(form).find('#session_json').val(JSON.stringify(session));
  let fsalesId = typeof freshsales !== 'undefined' ? freshsales.anonymous_id : 'Error - freshsales is not defined';
  let data = {
    'user_first_name': firstName,
    'user_last_name': lastName,
    'user_phone': phoneNumber,
    'user_company': companyName,
    'user_name': firstName + ' ' + lastName,
    'email': email,
    'gdpr_first_opt_in': ($form.find('input[name="send_promotions"]').is(':checked')),
    'country': geoLocation.countryName,
    'region_name': session.location.regionName,
    'zip_code': session.location.zipCode,
    'session_json': JSON.stringify(session),
    'first_referrer': (isExternalIframeSignup && currentReferrer) ? currentReferrer : (Cookie.get('fw_fr') || window.location.href),
    'first_landing_url': Cookie.get('fw_flu') || '',
    'freshsales_id': fsalesId,
    'fs_cookie': fsCookie,
    'currency': currencyUnit
  };
  // let plan = $form.find('input[name="plan-id"]').val();
  // if (plan !== undefined && plan !== '') {
  //   data['plan'] = plan;
  // }

  // Freshmarketer Data
  // alert(Cookie.get('fc_company_name'));
  const freshmarketerData = {
    'freshmarketerObject': {
      'first_name': Cookie.get('fc_first_name'),
      'last_name': Cookie.get('fc_last_name'),
      'email': Cookie.get('fc_email_id'),
      'company': companyName,
      'phone': Cookie.get('fc_phone_number'),
      'country': geoLocation.countryName,
      // 'number_of_team_members': 4,
      // 'contactable': ($form.find('input[name="send_promotions"]').is(':checked')),
      'custom_field': {
        'cf_fchatagentcount': teamMembers,
        // 'cf_fchatcurrentchatproduct': currentChatProduct,
        'cf_fchatusage': chatUsage,
        'cf_freshmarketer_list': $form.find('.fm-list-id').val()
      }
    }
  };
   const freshsalesDeferred = $.Deferred();
   const newLead = {
     'First name': firstName,
     'Last name': lastName,
     'Email': email,
     'Work': phoneNumber || 'Not filled',
     'Country': geoLocation.countryName,
     'Source': 'Inbound',
     'Campaign': 'Demo Request',
     'Sales Campaign': 'Freshchat - Demo',
     'Product': 'Freshchat',
     'Signup Referrer': Cookie.get('fw_flu') || '',
     'First Referrer': Cookie.get('fw_fr') || '',
     'Freshchat Usage': chatUsage,
     'fs_update': false
   };
   $form.find('.button').addClass('button--loading').attr('disabled', 'disabled');
   freshsales.identify(email, newLead, function () {
     freshsalesDeferred.resolve();
   });

   setTimeout(function () {
     jQuery.when(
       freshsalesDeferred,
       SiteUtilities.freshmarketerPost(freshmarketerData, false, form)
     ).then(function () {
       window.location.href = $form.attr('data-redirect') + `/?ehash=${emailHash}`;
     });
   }, 300);
  if(signupEnabled){
    $.ajax({
      url: signUpApiUrl,
      type: 'POST',
      data: $.param(data),
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      success: (response) => {
        if (response.success === true) {
          fchatSignupFormSuccess($form, response);
        } else if (response.success === false) {
          errorWrapper.addClass('error');
          $form.find('.button').removeClass('button--loading').removeAttr('disabled');
          window.location.href = response.redirectUri + `?ehash=${emailHash}`;
        }
      },
      error: (xhr, status, err) => {
        $form.find('.button').removeClass('button--loading').removeAttr('disabled');
        errorWrapper.addClass('error');
        errorWrapper.html('Service unavailable');
        SiteUtilities.log(
          'Internal Server error',
          'submitHandlers.fchatSignupForm',
          2,
          err
        );
      },
      complete: () => {
        $form.find('.button').removeClass('button--loading').attr('disabled', null);
      }
    });
  }
};

export default {
  fchatSignupForm,
  fchatDemoRequestForm,
  fchatWhatsAppOnBoardingForm,
  fchatWhatsAppOnBoardingForm2,
  getFchatCurrencyUnit,
  fchatSignupFormSuccess
};
