class StudentCoursesController < ApplicationController
  def create
    course_to_add = Course.find(params[:course_id])
    unless current_user.course.include?(course_to_add)
      StudentCourse.create(course: course_to_add,student: current_user)
      flash[:notice] = "Enrollment Successful in #{course_to_add.name}"
      redirect_to current_user
    else
      flash[:notice] = "Something went wrong , in the Enrollment"
    end
  end
  def delete
    course_to_remove = Course.find(params[:course_id])
    if @mine = StudentCourse.where(:course_id => course_to_remove).where(:student_id => current_user.id).first
      @mine.destroy
      flash[:notice] = "Disenrollment Successful in #{course_to_remove.name}"
      redirect_to current_user
    else
      flash[:notice] = "error while disenrolling #{course_to_remove.name}"
    end
  end

end
