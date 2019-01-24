class CoursesController < ApplicationController

  skip_before_action :require_user
  
  def index
    @course=Course.all
  end
  def new

  end

end
