class StudentsController < ApplicationController
  skip_before_action :require_user , only: [:new, :create]
  before_action :set_student , only: [ :show, :edit , :update ]
  before_action :require_same_student , only: [ :edit, :update]

  def index
    if !params[:course_id].nil?
      @students=Student.where(id: StudentCourse.select('student_id').where(course_id: params[:course_id]))
    else
      @students=Student.all
    end
  end
  def show

  end
  def new
    @student=Student.new
  end
  def create
    @student=Student.new(student_params)
    if @student.save
      UserMailer.welcome_email(@student).deliver_now
      session[:student_id]=@student.id
      flash[ :notice ] = "Sign up Successful"
      redirect_to @student
    else
      render 'new'
    end
  end

  def edit

  end

  def update
    if @student.update(student_params)
      flash[ :notice ] = "Edit Successful"
      redirect_to @student
    else
      render 'edit'
    end
  end

  private

  rescue_from ActiveRecord::RecordNotFound do
    flash[:notice] = 'The object you tried to access does not exist'
    redirect_to root_path
  end

  def set_student()
      @student=Student.find(params[:id])
  end

  def student_params()
    params.require(:student).permit(:name, :email, :password_confirmation, :password)
  end

  def require_same_student()
    if current_user != @student
      flash[:notice]="Access Denied"
      redirect_to student_path(current_user)
    end
  end
end
