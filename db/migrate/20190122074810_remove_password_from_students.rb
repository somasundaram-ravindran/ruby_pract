class RemovePasswordFromStudents < ActiveRecord::Migration[5.2]
  def change
    remove_column :students, :password, :string
  end
end
