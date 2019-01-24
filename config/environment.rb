# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize!

ActionView::Base.field_error_proc = Proc.new do |html_tag, instance|
  html_tag.html_safe
end

config.action_mailer.delivery_method = :smtp

config.action_mailer.smtp_settings = {
   address:              'smtp.gmail.com',
   port:                 587,
   domain:               'example.com',
   user_name:            '<username>',
   password:             '<password>',
   authentication:       'plain',
   enable_starttls_auto: true
}
