class UserMailer < ApplicationMailer
  default from: 'tester101r81@example.com'
  def welcome_email(student)
    @student = student
    mail(to:'somasundaramr81@gmail.com',subject:'Merry Christmas')
  end
  def raw_email( email, subject, body )
    mail(
      :to => email,
      :subject => subject
      ) do |format|
        format.text { render :text => body }
      end
  end
end
